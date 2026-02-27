use std::sync::Arc;

use crate::{
    app::AppState,
    dto::{self, settings::Settings},
    error::{self, Error, Result},
    game::proto::{Endpoints, ServiceInbound, WebOutbound},
};
pub mod proto;
use common::{
    dto::{
        GameFeatures, SessionCreate,
        asr::{ASR, ResultType},
    },
    file_store::{Store, StoreError},
    mq,
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

    enpoints: Arc<Endpoints>,

    settings: Settings,
    expected_speech: String,
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

        let final_transcript = self.speech_loop().await?;

        let transcript_result = self
            .enpoints
            .transcript
            .send(dto::transcript::Request {
                speech_text: final_transcript.full_text.clone(),
                expected_text: self.expected_speech.clone(),
            })
            .await?;
        println!("{transcript_result:?}");

        self.game.send(GameOutbound::End).await?;
        self.web
            .send(WebOutbound::Results(transcript_result))
            .await?;

        Ok(())
    }

    async fn speech_loop(&mut self) -> Result<ASR> {
        loop {
            select! {
                Ok(msg) = self.game.recv() => {
                    match msg {
                        GameInbound::Audio(audio_chunk) => {
                            self.audio_tx.send(audio_chunk).await?;
                        }
                        GameInbound::Stress(stress_request) => {
                            let mut request = stress_request;
                            request.session_id = Some(self.session_id);
                            self.stress_tx.send(request).await?;
                        }
                        GameInbound::SpeechEnd => {
                            self.audio_tx.send("END".as_bytes().to_vec()).await?;
                        }
                        _ => {
                            // ignore other messages
                            log::warn!("Got unexpected message {msg:?}");
                        }
                    }
                },
                Some(data) = self.result_rx.recv()=>{
                    let message = data?.get().await?;

                    log::debug!("Got message {:?}", message);

                    match message {
                        ServiceInbound::ASR(asr) => {
                            let is_end = asr.type_of == ResultType::Complete;
                            self.web.send(WebOutbound::ASR(asr.clone())).await?;
                            self.game.send(GameOutbound::ASR(asr.clone())).await?;

                            if is_end{
                                break Ok(asr);
                            }
                        }
                        ServiceInbound::Stress(st) => {
                            self.web.send(WebOutbound::Stress(st.clone())).await?;
                            self.game.send(GameOutbound::Stress(st)).await?;
                        }
                        ServiceInbound::Stuck => {
                            self.game.send(GameOutbound::Stuck).await?;
                        }
                        ServiceInbound::Unstuck => {
                            self.game.send(GameOutbound::Unstuck).await?;
                        }
                        ServiceInbound::StuckSuggestion(sg) => {
                            self.game.send(GameOutbound::StuckSuggestion(sg)).await?;
                        }
                    }
                },
                else => break Err(Error::SocketClose)
            };
        }
    }
}

pub async fn start_game(
    state: &AppState,
    store: &Store,
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
    let enpoints = state.endpoints.clone();

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

    let settings = proto::recv_message!(web, WebInbound::Start).unwrap();

    // TODO: validate document and settings.
    log::info!("Got game settings {settings:?}");

    let expected_speech = fetch_document(store, session_id, &settings.document_id).await?;

    tokio::spawn(async move {
        let mut game = Game {
            session_id,
            game,
            web,
            settings,
            audio_tx,
            stress_tx,
            result_rx,
            enpoints,
            expected_speech,
        };

        let result = game.run().await;
        if let Err(e) = result {
            log::error!("Game Error {e}")
        }
    });

    Ok(())
}

async fn fetch_document(
    store: &Store,
    session_id: uuid::Uuid,
    document_id: &str,
) -> Result<String> {
    let expected_id = format!("{session_id}/documents/content");

    if document_id != expected_id {
        // currently used by the test-ui
        if document_id == "placeholder-micromachines" {
            return Ok(include_str!("../../assets/placeholder-micromachines").to_owned());
        }

        return Err(Error::InvalidDocument(document_id.to_owned()));
    }

    store
        .read_str(expected_id)
        .await
        .map_err(error::Error::Store)
}
