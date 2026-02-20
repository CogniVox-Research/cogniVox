use serde::Serialize;

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
    lines: Vec<asr_rs::Line>,
    full_text: String,
    current_silence: Option<asr_rs::Silence>,
}

impl TranscriptionResult {
    pub fn new(session_id: String, data: asr_rs::Transcription) -> Self {
        TranscriptionResult {
            lines: data.clone().into_lines(),
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
