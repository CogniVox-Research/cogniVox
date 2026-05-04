use common::dto::asr::{ASR, ASRContent, Line, Silence};

const OPTIMAL_PACE_TPS: f64 = 2.5;
const PACE_SIGMA: f64 = 1.5;
const SILENCE_HALF_LIFE_SECS: f64 = 8.0;

/// Compute the audience engagement score from a single ASR snapshot.
pub fn engagement_score(asr: &ASR) -> Option<f32> {
    let content = match asr {
        ASR::Partial(c) => c,
        ASR::Complete(c) => &c.content,
    };
    score_from_content(content)
}

fn score_from_content(content: &ASRContent) -> Option<f32> {
    let lines = &content.lines;

    if lines.is_empty() && content.current_silence.is_none() {
        return None;
    }

    // Speech ratio
    let (speech_dur, silence_dur) = line_durations(lines);
    let trailing_silence_dur = content
        .current_silence
        .as_ref()
        .map(silence_length)
        .unwrap_or(0.0);
    let total_dur = speech_dur + silence_dur + trailing_silence_dur;

    let speech_ratio = if total_dur > 0.0 {
        (speech_dur / total_dur).clamp(0.0, 1.0) as f32
    } else {
        0.5 // no timing data yet – neutral
    };

    let token_clarity = mean_token_probability(lines).unwrap_or(0.5);

    //Speaking pace
    // Gaussian bell-curve centred on OPTIMAL_PACE_TPS.
    // Scores 1.0 at exactly the optimal rate and falls off symmetrically.
    let pace_score = if speech_dur > 0.0 {
        let total_tokens = count_tokens(lines) as f64;
        let tps = total_tokens / speech_dur;
        let delta = tps - OPTIMAL_PACE_TPS;
        let score = (-(delta * delta) / (2.0 * PACE_SIGMA * PACE_SIGMA)).exp();
        score as f32
    } else {
        0.5
    };

    // Exponential decay: silence_factor = 0.5^(t / half_life)
    // At t=0 → 1.0 (no penalty); at t=half_life → 0.5; t→∞ → 0.0
    let silence_factor = if trailing_silence_dur > 0.0 {
        let exponent = trailing_silence_dur / SILENCE_HALF_LIFE_SECS;
        (0.5_f64.powf(exponent)).clamp(0.0, 1.0) as f32
    } else {
        1.0
    };

    let raw =
        0.35 * speech_ratio + 0.25 * token_clarity + 0.30 * pace_score + 0.15 * silence_factor;

    let engagement = raw.clamp(0.0, 1.0);

    Some(engagement)
}

// ── helpers ───────────────────────────────────────────────────────────────────

/// Returns `(total_speech_seconds, total_silence_seconds)` from a line slice.
fn line_durations(lines: &[Line]) -> (f64, f64) {
    let mut speech = 0.0f64;
    let mut silence = 0.0f64;
    for line in lines {
        match line {
            Line::Complete(seg) | Line::Partial(seg) => {
                speech += (seg.timestamp.end - seg.timestamp.start).max(0.0);
            }
            Line::Silence(s) => {
                silence += silence_length(s);
            }
        }
    }
    (speech, silence)
}

fn silence_length(s: &Silence) -> f64 {
    (s.timestamp.end - s.timestamp.start).max(0.0)
}

/// Mean token probability over all speech lines; returns `None` when there
/// are no tokens at all.
fn mean_token_probability(lines: &[Line]) -> Option<f32> {
    let mut sum = 0.0f32;
    let mut count = 0usize;
    for line in lines {
        match line {
            Line::Complete(seg) | Line::Partial(seg) => {
                for tok in &seg.tokens {
                    sum += tok.probability.clamp(0.0, 1.0);
                    count += 1;
                }
            }
            Line::Silence(_) => {}
        }
    }
    if count == 0 {
        None
    } else {
        Some(sum / count as f32)
    }
}

fn count_tokens(lines: &[Line]) -> usize {
    lines.iter().map(Line::num_tokens).sum()
}

/// Returns `(complete_count, partial_count)`.
fn count_line_types(lines: &[Line]) -> (usize, usize) {
    lines.iter().fold((0, 0), |(c, p), line| match line {
        Line::Complete(_) => (c + 1, p),
        Line::Partial(_) => (c, p + 1),
        Line::Silence(_) => (c, p),
    })
}

#[cfg(test)]
mod tests {
    use common::dto::{
        ASRSessionType,
        asr::{Segment, Timestamp, Token},
    };

    use super::*;

    fn make_segment(start: f64, end: f64, n_tokens: usize, prob: f32) -> Segment {
        let tokens = (0..n_tokens)
            .map(|i| Token {
                text: format!("w{i}"),
                probability: prob,
            })
            .collect();
        Segment {
            text: "test".into(),
            tokens,
            probability: prob,
            timestamp: Timestamp { start, end },
        }
    }

    fn make_content(lines: Vec<Line>, trailing_silence: Option<Silence>) -> ASRContent {
        ASRContent {
            session_id: "test".into(),
            session_type: ASRSessionType::Speech,
            lines,
            full_text: String::new(),
            current_silence: trailing_silence,
        }
    }

    #[test]
    fn highly_engaged_session() {
        // Rapid, clear, complete speech — no silence.
        let lines = vec![
            Line::Complete(make_segment(0.0, 4.0, 10, 0.95)),
            Line::Complete(make_segment(4.0, 8.0, 10, 0.92)),
            Line::Complete(make_segment(8.0, 12.0, 10, 0.97)),
        ];
        let content = make_content(lines, None);
        let asr = ASR::Partial(content);
        let bd = engagement_score(&asr).unwrap();
        println!("{bd:#?}");
        assert!(bd > 0.75, "expected high engagement, got {}", bd);
    }

    #[test]
    fn low_engagement_mostly_silence() {
        let lines = vec![
            Line::Complete(make_segment(0.0, 1.0, 2, 0.60)),
            Line::Silence(Silence {
                timestamp: Timestamp {
                    start: 1.0,
                    end: 30.0,
                },
            }),
        ];
        let trailing = Silence {
            timestamp: Timestamp {
                start: 30.0,
                end: 45.0,
            },
        };
        let content = make_content(lines, Some(trailing));
        let asr = ASR::Partial(content);
        let bd = engagement_score(&asr).unwrap();
        println!("{bd:#?}");
        assert!(bd < 0.50, "expected low engagement, got {}", bd);
    }

    #[test]
    fn empty_session_returns_none() {
        let content = make_content(vec![], None);
        let asr = ASR::Partial(content);
        assert!(engagement_score(&asr).is_none());
    }
}
