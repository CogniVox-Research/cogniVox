use crate::{
    dto::{self, sds, settings::Settings},
    game::proto::Endpoints,
};

#[async_trait]
pub trait SpeechScore {
    async fn get_speech_score(
        &self,
        settings: &Settings,
        speech_text: &str,
        recording_file: &str,
    ) -> Option<sds::Response>;
}

#[async_trait]
impl SpeechScore for Endpoints {
    async fn get_speech_score(
        &self,
        settings: &Settings,
        speech_text: &str,
        recording_file: &str,
    ) -> Option<sds::Response> {
        let speech_type = match settings.scene {
            dto::settings::SceneType::Interview => "1",
            dto::settings::SceneType::BoardRoom { size: _ } => "2",
            dto::settings::SceneType::Stage { size: _ } => "3",
        };

        let result = self
            .speech_score
            .send(dto::sds::Request {
                audio_key: recording_file.to_owned(),
                transcript: speech_text.to_owned(),
                speech_type: speech_type.to_owned(),
            })
            .await;
        match result {
            Ok(v) => Some(v),
            Err(e) => {
                log::error!("Failed to run get speech score: {e}");
                None
            }
        }
    }
}
