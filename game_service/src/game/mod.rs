use crate::{
    app::AppState,
    dto::{self, settings::Settings},
    error::{Error, Result},
    game::proto::{ServiceInbound, WebOutbound},
};
pub mod proto;
use common::{
    dto::{GameFeatures, SessionCreate},
    mq::{self, MQError, Message},
};
use proto::{GameConnection, GameInbound, GameOutbound, WebConnection, WebInbound};
use rocket::tokio::{self, select};

pub struct Game {
    session_id: uuid::Uuid,

    game: GameConnection,
    web: WebConnection,

    audio_tx: mq::Sender<Vec<u8>>,
    stress_tx: mq::Sender<dto::stress::StressRequest>,
    result_rx: mq::Consumer<proto::ServiceInbound>,

    settings: Settings,
}

impl Game {
    async fn run(&mut self) -> Result<()> {
        let game_settings = (&self.settings).into();
        self.game.send(GameOutbound::Init(game_settings)).await?;

        let features = proto::recv_message!(self.game, GameInbound::Ready)?;
        log::info!("Game ready with features {features:?}");

        log::info!("Waiting for speech to start");
        proto::wait_for!(self.game, GameInbound::SpeechStart)?;
        log::info!("Speech started");
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
                    match self.on_transctipt_recieve(data).await{
                        Ok(())=>continue,
                        Err(e)=> Err(e)
                    }
                },
                else => Err(Error::SocketClose)
            };

            break result;
        }
    }

    async fn on_transctipt_recieve(
        &mut self,
        tr: Result<Message<ServiceInbound>, MQError>,
    ) -> Result<()> {
        let message = tr?.get().await?;

        log::info!("Got message {:?}", message);

        match message {
            ServiceInbound::ASR(asr) => {
                self.web.send(WebOutbound::ASR(asr.clone())).await?;
                self.game.send(GameOutbound::ASR(asr)).await
            }
            ServiceInbound::Stress(st) => {
                self.web.send(WebOutbound::Stress(st.clone())).await?;
                self.game.send(GameOutbound::Stress(st)).await
            }
            ServiceInbound::Stuck => self.game.send(GameOutbound::Stuck).await,
            ServiceInbound::StuckSuggestion(sg) => {
                self.game.send(GameOutbound::StuckSuggestion(sg)).await
            }
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
            GameInbound::SpeechEnd => {
                self.audio_tx.send("END".as_bytes().to_vec()).await?;
                Ok(true)
            }
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
    log::info!("Game connected successfully");

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

    let result_rx = state
        .mq_connection
        .recieve(None)
        .await?
        .bind_exchange("asr".to_owned(), session_id_str.clone())
        .await?
        .bind_exchange("results".to_owned(), session_id_str)
        .await?;

    tokio::spawn(async move {
        let settings = proto::recv_message!(web, WebInbound::Start).unwrap();

        // TODO: validate document and settings.
        log::info!("Got game settings {settings:?}");

        let mut game = Game {
            session_id,
            game,
            web,
            settings,
            audio_tx,
            stress_tx,
            result_rx,
        };

        let result = game.run().await;
        if let Err(e) = result {
            log::error!("Game WS Error {e}")
        }
    });

    Ok(())
}
