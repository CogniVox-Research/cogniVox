use std::sync::Arc;
pub mod test_session;

use crate::{
    app::AppState,
    dto::{self, settings::Settings},
    error::{self, Error, Result},
    game::proto::{Endpoints, MQSession, ServiceInbound, WebOutbound},
};
pub mod proto;
use common::{
    dto::asr::{ASR, ResultType},
    file_store::Store,
};
use proto::{GameConnection, GameInbound, GameOutbound, WebConnection, WebInbound};
use rocket::tokio::{self, select};

pub struct Game {
    session_id: uuid::Uuid,

    game: GameConnection,
    web: WebConnection,
    mq: MQSession,

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

        let speech_score = self
            .enpoints
            .speech_score
            .send(dto::sds::Request {
                audio_key: format!("{}/recordings/converted.wav", self.session_id.to_string()),
                transcript: final_transcript.full_text.clone(),
            })
            .await?;

        self.game.send(GameOutbound::End).await?;
        self.web
            .send(WebOutbound::Results(transcript_result, speech_score))
            .await?;

        Ok(())
    }

    async fn speech_loop(&mut self) -> Result<ASR> {
        loop {
            select! {
                Ok(msg) = self.game.recv() => {
                    match msg {
                        GameInbound::Audio(audio_chunk) => {
                            self.mq.send_audio(audio_chunk).await?;
                        }
                        GameInbound::Stress(stress_request) => {
                            let mut request = stress_request;
                            request.session_id = Some(self.session_id);
                            self.mq.send_stress_metrics(request).await?;
                        }
                        GameInbound::SpeechEnd => {
                            self.mq.send_audio("END".as_bytes().to_vec()).await?;
                        }
                        _ => {
                            // ignore other messages
                            log::warn!("Got unexpected message {msg:?}");
                        }
                    }
                },
                Some(data) = self.mq.recv()=>{
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

    let session_mq = MQSession::new(&state.mq_connection, session_id).await?;
    session_mq
        .create_asr_session(&state.asr_session_queue)
        .await?;
    log::info!("MQ initialized for session");

    let enpoints = state.endpoints.clone();

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
            enpoints,
            mq: session_mq,
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
        .read_str(&expected_id)
        .await
        .map_err(error::Error::Store)
}
