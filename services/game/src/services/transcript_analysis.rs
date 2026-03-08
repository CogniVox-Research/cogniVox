use crate::{
    dto::{self, transcript},
    game::proto::Endpoints,
};

#[async_trait]
pub trait TranscriptAnalysis {
    async fn transcript_analysis(
        &self,
        speech_text: &str,
        expected_speech: &str,
    ) -> Option<transcript::Response>;
}

#[async_trait]
impl TranscriptAnalysis for Endpoints {
    async fn transcript_analysis(
        &self,
        speech_text: &str,
        expected_speech: &str,
    ) -> Option<transcript::Response> {
        let result = self
            .transcript
            .send(dto::transcript::Request {
                speech_text: speech_text.to_owned(),
                expected_text: expected_speech.to_owned(),
            })
            .await;
        match result {
            Ok(v) => Some(v),
            Err(e) => {
                log::error!("Failed to run transcript_analysis: {e}");
                None
            }
        }
    }
}
