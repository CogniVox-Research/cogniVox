use crate::{
    app::{AppState, SessionCreate},
    dto::{
        self,
        settings::{GameFeatures, Settings},
    },
    error::{Error, Result},
    game::proto::WebOutbound,
};
pub mod proto;
use common::mq::{self, ConsumerConfig};
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

    audio_tx: mq::Sender<Vec<u8>>,
    stress_tx: mq::Sender<dto::stress::StressRequest>,
    transcript_rx: mq::Consumer<common::dto::asr::ASR>,
    result_rx: mq::Consumer<serde_json::Value>,

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
                Some(data) = self.result_rx.recv()=>{
                    println!("{:?}", data);
                    continue;
                },
                Some(data) = self.transcript_rx.recv()=>{
                    println!("{:?}", data);
                    continue;
                },
                else => Err(Error::SocketClose)
            };

            break result;
        }
    }

    async fn speech_loop_game_inbound(&mut self, message: GameInbound) -> Result<bool> {
        match message {
            GameInbound::Audio(audio_chunk) => {
                self.audio_tx.send(audio_chunk).await?;
                Ok(false)
            }
            GameInbound::Stress(stress_request) => {
                self.stress_tx.send(stress_request).await?;
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
    state: &AppState,
    session_id: uuid::Uuid,
    game: GameConnection,
    mut web: WebConnection,
) -> Result<()> {
    web.send(WebOutbound::GameConnected).await?;

    let settings = proto::recv_message!(web, WebInbound::Start)?;

    // TODO: validate document and settings.

    state
        .session_queue
        .send(SessionCreate {
            session_id,
            features: GameFeatures { stress: false },
        })
        .await?;

    let session_id_str = session_id.to_string();

    let audio_tx = state
        .mq_connection
        .sender(&session_id_str, Some("audio".to_owned()))
        .await?;
    let stress_tx = state
        .mq_connection
        .sender(&session_id_str, Some("stress".to_owned()))
        .await?;

    let transcript_rx = state
        .mq_connection
        .recieve(ConsumerConfig {
            routing_key: Some(session_id_str.clone()),
            exchange_name: Some("asr".to_owned()),
            queue_name: None,
        })
        .await?;

    let result_rx = state
        .mq_connection
        .recieve(ConsumerConfig {
            routing_key: Some(session_id_str.clone()),
            exchange_name: Some("result".to_owned()),
            queue_name: None,
        })
        .await?;

    let mut game = Game {
        session_id,
        game,
        web,
        settings,
        audio_tx,
        stress_tx,
        result_rx,
        transcript_rx,
    };

    tokio::spawn(async move { game.run().await });

    Ok(())
}
