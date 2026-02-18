use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Segment {
    Complete(asr_rs::Segment),
    Partial(asr_rs::Segment),
    Silence(asr_rs::Silence),
}

impl Segment {
    fn start_time(&self) -> f64 {
        match self {
            Segment::Complete(segment) => segment.timestamp.start,
            Segment::Partial(segment) => segment.timestamp.start,
            Segment::Silence(silence) => silence.timestamp.start,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultType {
    Partial,
    Complete,
}

#[derive(Debug, Serialize)]
pub struct TranscriptionResult {
    #[serde(rename = "type")]
    type_of: ResultType,
    session_id: String,
    lines: Vec<Segment>,
    full_text: String,
    current_silence: Option<asr_rs::Silence>,
}

impl TranscriptionResult {
    pub fn new(session_id: String, data: asr_rs::Transcription) -> Self {
        let mut lines = Vec::new();

        for seg in data.finalized {
            lines.push(Segment::Complete(seg));
        }

        for seg in data.processing {
            lines.push(Segment::Partial(seg));
        }

        for seg in data.silences {
            lines.push(Segment::Silence(seg));
        }

        lines.sort_by(|a, b| a.start_time().total_cmp(&b.start_time()));

        TranscriptionResult {
            lines,
            current_silence: data.current_silence,
            full_text: data.full_text,
            session_id: session_id,
            type_of: if !data.is_complete {
                ResultType::Partial
            } else {
                ResultType::Complete
            },
        }
    }
}
