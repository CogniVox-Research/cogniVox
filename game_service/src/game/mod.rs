use crate::{
    dto::settings::Settings,
    error::{Error, Result},
    game::proto::WebOutbound,
};
pub mod proto;
use proto::{GameConnection, GameInbound, GameOutbound, WebConnection, WebInbound};
use rocket::tokio::{self, select};

pub enum GameState {
    /// Waiting for user to start the game.
    Waiting,
    Speech,
    Question,
}

pub struct Game {
    session_id: uuid::Uuid,

    game: GameConnection,
    web: WebConnection,

    settings: Settings,
}

impl Game {
    async fn run(&mut self) -> Result<()> {
        let game_settings = (&self.settings).into();
        self.game.send(GameOutbound::Init(game_settings)).await?;

        let features = proto::recv_message!(self.game, GameInbound::Ready)?;
        log::info!("Game ready with features {features:?}");

        // TODO: start asr, stuck, stress services

        proto::wait_for!(self.game, GameInbound::SpeechStart)?;
        self.speech_loop().await?;

        Ok(())
    }

    async fn speech_loop(&mut self) -> Result<()> {
        loop {
            let result = select! {
                Ok(msg) = self.game.recv() => {
                    let result= self.speech_loop_game_inbound(msg).await;
                    match result {
                        Ok(false)=> continue,
                        Ok(true)=> Ok(()),
                        Err(e)=> Err(e)
                    }
                },
                else => Err(Error::SocketClose)
            };

            break result;
        }
    }

    async fn speech_loop_game_inbound(&mut self, message: GameInbound) -> Result<bool> {
        match message {
            GameInbound::Audio(audio_chunk) => {
                // TODO: send asr service
                Ok(false)
            }
            GameInbound::Stress(stress_request) => {
                // TODO: send to stress service

                Ok(false)
            }
            GameInbound::SpeechEnd => Ok(true),
            _ => {
                // ignore other messages
                log::warn!("Got unexpected message {message:?}");
                Ok(false)
            }
        }
    }
}

pub async fn start_game(
    session_id: uuid::Uuid,
    game: GameConnection,
    mut web: WebConnection,
) -> Result<()> {
    web.send(WebOutbound::GameConnected).await?;

    let settings = proto::recv_message!(web, WebInbound::Start)?;

    // TODO: validate document and settings.

    let mut game = Game {
        session_id,
        game,
        web,
        settings,
    };

    tokio::spawn(async move { game.run().await });

    Ok(())
}
