use std::{sync::Arc, time::Instant};
pub mod test_session;

use crate::{
    app::{AppState, PendingSession},
    dto::{
        self,
        llm::{self, Question},
        sds,
        settings::Settings,
        stress, transcript,
    },
    error::{Error, Result},
    game::proto::{MQSession, ServiceInbound, WebOutbound},
    services::{LLM, SpeechScore, TranscriptAnalysis},
};
pub mod proto;
use common::dto::{
    ASRSessionType, GameFeatures,
    asr::{ASR, ASRContentComplete},
};
use proto::{GameConnection, GameInbound, GameOutbound, WebConnection};
use rocket::tokio::{self, select};

pub struct Game {
    session_id: uuid::Uuid,

    game: GameConnection,
    web: WebConnection,

    settings: Settings,
    game_settings: GameFeatures,
    expected_speech: String,

    stress_data: dto::stress::OverallRequest,
    questions: Option<Vec<llm::Question>>,

    state: Arc<AppState>,
}

impl Game {
    async fn run(&mut self) -> Result<()> {
        let start_time = Instant::now();

        log::info!("Waiting for speech to start");
        proto::wait_for!(self.game, GameInbound::SpeechStart)?;
        log::info!("Speech started");

        let speech_asr = self.speech_loop(true).await?;

        let answer_result = if let Some(questions) = self.questions.take() {
            self.ask_questions(questions).await?
        } else {
            None
        };

        let (sds_score, ta_result) = self
            .get_final_results(&speech_asr.full_text, &speech_asr.recording_file)
            .await;

        self.stress_data.duration_seconds = Instant::now().duration_since(start_time).as_secs_f64();
        let stress_result = self
            .state
            .endpoints
            .stress_plan(self.stress_data.clone())
            .await;

        self.web
            .send(WebOutbound::Results {
                transcript_analysis: ta_result,
                speech_score: sds_score,
                answer_score: answer_result,
                stress_result,
            })
            .await?;

        self.game.send(GameOutbound::End).await?;

        Ok(())
    }

    async fn get_final_results(
        &self,
        speech_text: &str,
        recording_file: &str,
    ) -> (Option<sds::Response>, Option<transcript::Response>) {
        let transcript_analysis = self
            .state
            .endpoints
            .transcript_analysis(speech_text, &self.expected_speech)
            .await;
        let speech_score = self
            .state
            .endpoints
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
        let mut speech_mq = MQSession::new(&self.state.mq_connection, asr_session_id).await?;
        log::info!("MQ initialized for speech");

        speech_mq
            .create_asr_session(
                &self.state.asr_session_queue,
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
                            if !is_speech{
                                self.check_answer_end(&asr).await;
                                self.web.send(WebOutbound::QuestionASR(asr.clone())).await?;
                            }else{
                                self.web.send(WebOutbound::ASR(asr.clone())).await?;
                            }

                            if let ASR::Complete(complete) = asr{
                                break Ok(complete);
                            }
                        }
                        ServiceInbound::Stress(st) => {
                            self.update_stress(&st);
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

    fn update_stress(&mut self, data: &stress::StressResponse) {
        self.stress_data.max_stress = data.stress_score.max(self.stress_data.max_stress);
        self.stress_data.total_stress += data.stress_score;
        self.stress_data.total_events += 1;
        if data.stress_score > 0.6 {
            self.stress_data.high_stress_events += 1;
        }
    }

    async fn ask_questions(
        &mut self,
        questions: Vec<Question>,
    ) -> Result<Option<llm::EvaluateResult>> {
        self.web.send(WebOutbound::QuestionsBegin).await?;

        let mut answers = vec![];
        for question in questions {
            self.web
                .send(WebOutbound::Question(question.question.to_owned()))
                .await?;
            self.game
                .send(GameOutbound::Question(question.question.to_owned()))
                .await?;

            log::info!("Waiting for answer to start");
            proto::wait_for!(self.game, GameInbound::QuestionStart)?;
            let question_asr = self.speech_loop(false).await?;
            log::info!("Answer Ended");
            self.web.send(WebOutbound::QuestionEnd).await?;

            answers.push(llm::AnswerEvaluateItem {
                question: question.question.clone(),
                sample_answer: question.sample_answer.clone(),
                user_answer: question_asr.full_text.clone(),
            });
        }

        Ok(self.state.endpoints.score_answers(answers).await)
    }

    async fn check_answer_end(&mut self, asr: &ASR) {
        if let Some(ref silence) = asr.current_silence {
            let duration = silence.timestamp.end - silence.timestamp.start;
            let words: usize = asr.lines.iter().map(|l| l.num_tokens()).sum();
            if words > self.state.config.min_answer_words
                && duration > self.state.config.max_answer_silence
            {
                let _ = self.game.send(GameOutbound::AnswerEnd).await;
            }
        }
    }
}

pub async fn start_game(
    state: &Arc<AppState>,
    mut game: GameConnection,
    web: PendingSession,
) -> Result<()> {
    web.con.send(WebOutbound::GameConnected).await?;
    log::info!("Game connected successfully");

    let app_state = state.clone();

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
                questions: web.questions,
                settings: web.settings,
                expected_speech: web.document,
                game_settings,
                state: app_state,
                stress_data: stress::OverallRequest::default(),
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
