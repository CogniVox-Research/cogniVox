use common::dto::asr;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TranscriptionResult {
    #[serde(flatten)]
    pub dto: asr::ASR,
}

impl TranscriptionResult {
    pub fn new(session_id: &str, data: asr_rs::Transcription) -> Self {
        TranscriptionResult {
            dto: asr::ASR {
                full_text: data.full_text.clone(),
                session_id: session_id.to_owned(),
                type_of: if !data.is_complete {
                    asr::ResultType::Partial
                } else {
                    asr::ResultType::Complete
                },
                current_silence: data.current_silence.clone().map(convert_silence),
                lines: convert_lines(data.into_lines()),
            },
        }
    }
}

fn convert_lines(lines: Vec<asr_rs::Line>) -> Vec<asr::Line> {
    let mut result = Vec::with_capacity(lines.len());

    for line in lines {
        result.push(match line {
            asr_rs::Line::Complete(s) => asr::Line::Complete(convert_segment(s)),
            asr_rs::Line::Partial(s) => asr::Line::Partial(convert_segment(s)),
            asr_rs::Line::Silence(s) => asr::Line::Silence(convert_silence(s)),
        });
    }

    result
}

fn convert_silence(s: asr_rs::Silence) -> asr::Silence {
    asr::Silence {
        timestamp: convert_timestamp(s.timestamp),
    }
}

fn convert_segment(s: asr_rs::Segment) -> asr::Segment {
    asr::Segment {
        text: s.text,
        tokens: s
            .tokens
            .into_iter()
            .map(|v| asr::Token {
                text: v.text,
                probability: v.probability,
            })
            .collect(),
        probability: s.probability,
        timestamp: convert_timestamp(s.timestamp),
    }
}

fn convert_timestamp(t: asr_rs::Timestamp) -> asr::Timestamp {
    asr::Timestamp {
        start: t.start,
        end: t.end,
    }
}
