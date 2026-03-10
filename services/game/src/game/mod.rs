use std::{sync::Arc, time::Duration};
pub mod test_session;

use crate::{
    app::{AppState, PendingSession},
    dto::{sds, settings::Settings, transcript},
    error::{Error, Result},
    game::proto::{Endpoints, MQSession, ServiceInbound, WebOutbound},
    services::{SpeechScore, TranscriptAnalysis},
};
pub mod proto;
use common::{
    dto::{
        ASRSessionType, GameFeatures,
        asr::{ASR, ASRContentComplete},
    },
    mq,
};
use proto::{GameConnection, GameInbound, GameOutbound, WebConnection};
use rocket::tokio::{self, select, time::sleep};

pub struct Game {
    session_id: uuid::Uuid,

    game: GameConnection,
    web: WebConnection,
    mq_connection: Arc<mq::Connection>,
    enpoints: Arc<Endpoints>,

    settings: Settings,
    game_settings: GameFeatures,
    expected_speech: String,
    asr_session_queue: common::mq::Sender<common::dto::ASRSessionCreate>,
}

impl Game {
    async fn run(&mut self) -> Result<()> {
        log::info!("Waiting for speech to start");
        proto::wait_for!(self.game, GameInbound::SpeechStart)?;
        log::info!("Speech started");

        let speech_asr = self.speech_loop(true).await?;
        // TODO: questions

        let questions = vec!["Test question".to_owned()];

        for question in questions.iter() {
            self.game
                .send(GameOutbound::Question(question.to_owned()))
                .await?;
            log::info!("Waiting for answer to start");
            proto::wait_for!(self.game, GameInbound::QuestionStart)?;
            let question_asr = self.speech_loop(false).await?;
            // TODO: question processing
        }

        let (sds_score, ta_result) = self
            .get_final_results(&speech_asr.full_text, &speech_asr.recording_file)
            .await;

        self.web
            .send(WebOutbound::Results {
                transcript_analysis: ta_result,
                speech_score: sds_score,
            })
            .await?;

        self.game.send(GameOutbound::End).await?;

        sleep(Duration::from_secs(1)).await;
        Ok(())
    }

    async fn get_final_results(
        &self,
        speech_text: &str,
        recording_file: &str,
    ) -> (Option<sds::Response>, Option<transcript::Response>) {
        let transcript_analysis = self
            .enpoints
            .transcript_analysis(speech_text, &self.expected_speech)
            .await;
        let speech_score = self
            .enpoints
            .get_speech_score(&self.settings, speech_text, recording_file)
            .await;

        (speech_score, transcript_analysis)
    }

    async fn speech_loop(&mut self, is_speech: bool) -> Result<ASRContentComplete> {
        let asr_session_id = if is_speech {
            self.session_id
        } else {
            uuid::Uuid::new_v4()
        };
        let mut speech_mq = MQSession::new(&self.mq_connection, asr_session_id).await?;
        log::info!("MQ initialized for speech");

        speech_mq
            .create_asr_session(
                &self.asr_session_queue,
                self.game_settings.audio_format.clone(),
                if is_speech {
                    ASRSessionType::Speech
                } else {
                    ASRSessionType::Answer
                },
            )
            .await?;

        loop {
            select! {
                Ok(msg) = self.game.recv() => {
                    match msg {
                        GameInbound::Audio(audio_chunk) => {
                            speech_mq.send_audio(audio_chunk).await?;
                        }
                        GameInbound::Stress(stress_request) => {
                            let mut request = stress_request;
                            request.session_id = Some(self.session_id);
                            speech_mq.send_stress_metrics(request.clone()).await?;
                            self.web.send(WebOutbound::HeartRate(request)).await?;
                        }
                        GameInbound::SpeechEnd | GameInbound::QuestionEnd => {
                            speech_mq.send_audio("END".as_bytes().to_vec()).await?;
                        }
                        _ => {
                            // ignore other messages
                            log::warn!("Got unexpected message {msg:?}");
                        }
                    }
                },
                Some(data) = speech_mq.recv()=>{
                    let message = data?.get().await?;

                    log::debug!("Got message {:?}", message);

                    match message {
                        ServiceInbound::ASR(mut asr) => {
                            asr.session_id = self.session_id.to_string();
                            self.web.send(WebOutbound::ASR(asr.clone())).await?;
                            if let ASR::Complete(complete) = asr{
                                break Ok(complete);
                            }
                        }
                        ServiceInbound::Stress(st) => {
                            self.web.send(WebOutbound::Stress(st.clone())).await?;
                            self.game.send(GameOutbound::Stress(st)).await?;
                        }
                        ServiceInbound::Stuck => {
                            if is_speech {
                                self.game.send(GameOutbound::Stuck).await?;
                                self.web.send(WebOutbound::Stuck).await?;
                            }
                        }
                        ServiceInbound::Unstuck => {
                            if is_speech {
                                self.game.send(GameOutbound::Unstuck).await?;
                                self.web.send(WebOutbound::Unstuck).await?;
                            }
                        }
                        ServiceInbound::StuckSuggestion(sg) => {
                            if is_speech {
                                self.game.send(GameOutbound::StuckSuggestion(sg.clone())).await?;
                                self.web.send(WebOutbound::StuckSuggestion(sg.clone())).await?;
                            }
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
    mut game: GameConnection,
    web: PendingSession,
) -> Result<()> {
    web.con.send(WebOutbound::GameConnected).await?;
    log::info!("Game connected successfully");

    let enpoints = state.endpoints.clone();
    let asr_session_queue = state.asr_session_queue.clone();
    let mq_connection = state.mq_connection.clone();

    tokio::spawn(async move {
        let result = async move {
            let game_settings = (&web.settings).into();
            game.send(GameOutbound::Init(game_settings)).await?;

            let game_settings = proto::recv_message!(game, GameInbound::Ready)?;
            log::info!("Game ready with features {game_settings:?}");

            let mut game = Game {
                session_id: web.session_id,
                game,
                web: web.con,
                settings: web.settings,
                enpoints,
                mq_connection,
                expected_speech: web.document,
                asr_session_queue,
                game_settings,
            };

            game.run().await
        }
        .await;

        if let Err(e) = result {
            log::error!("Game Error {e}")
        }
    });

    Ok(())
}
