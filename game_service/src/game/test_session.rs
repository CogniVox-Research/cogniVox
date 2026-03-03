use std::time::Duration;

use common::file_store::Store;
use rocket::tokio::{self, time::sleep};

use crate::{
    app::AppState,
    dto::settings::{AudienceDifficulty, GameSettings, SceneType},
    error::Result,
    game::proto::{self, GameConnection, GameInbound},
    recv_message,
};

pub async fn start_test_session(
    state: &AppState,
    store: &Store,
    session_id: uuid::Uuid,
    mut game: GameConnection,
) -> Result<()> {
    tokio::spawn(async move {
        sleep(Duration::from_secs(1)).await;

        game.send(super::proto::GameOutbound::Init(GameSettings {
            difficulty: AudienceDifficulty::Hard,
            session_type: crate::dto::settings::Type::Speech,
            scene: SceneType::Stage { size: 10 },
            distractions: true,
            qa: true,
        }))
        .await?;

        let features = proto::recv_message!(game, GameInbound::Ready)?;
        log::info!("Game ready with features {features:?}");

        proto::wait_for!(game, GameInbound::SpeechStart)?;
        log::info!("Speech started");

        proto::wait_for!(game, GameInbound::SpeechEnd)?;
        log::info!("Speech Ended");

        sleep(Duration::from_secs(2)).await;

        let questions = vec!["Test question?"];

        for question in questions.iter() {
            game.send(super::proto::GameOutbound::Question(question.to_string()))
                .await?;

            proto::wait_for!(game, GameInbound::QuestionStart)?;
            log::info!("Question started");

            proto::wait_for!(game, GameInbound::QuestionEnd)?;
            log::info!("Question Ended");
        }

        game.send(super::proto::GameOutbound::End).await
    });
    Ok(())
}
