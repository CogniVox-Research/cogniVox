use crate::{
    dto::{
        llm::{self, AnswerEvaluate, CVQuestions, SpeechQuestions},
        stress,
    },
    game::proto::Endpoints,
};

#[async_trait]
pub trait Llm {
    async fn get_questions(&self, is_interview: bool, text: &str) -> Option<Vec<llm::Question>>;
    async fn score_answers(&self, qa: Vec<llm::AnswerEvaluateItem>) -> Option<llm::EvaluateResult>;
    async fn stress_plan(&self, stress: stress::OverallRequest) -> Option<stress::OverallResponse>;
}

#[async_trait]
impl Llm for Endpoints {
    async fn get_questions(&self, is_interview: bool, text: &str) -> Option<Vec<llm::Question>> {
        let result = if is_interview {
            self.interview_question
                .send(CVQuestions {
                    cv_text: text.to_owned(),
                })
                .await
        } else {
            self.speech_question
                .send(SpeechQuestions {
                    speech_content: text.to_owned(),
                })
                .await
        };

        match result {
            Ok(v) => Some(v.questions_and_answers),
            Err(e) => {
                log::error!("Failed to run create questions: {e}");
                None
            }
        }
    }

    async fn score_answers(&self, qa: Vec<llm::AnswerEvaluateItem>) -> Option<llm::EvaluateResult> {
        let result = self
            .evaluate_answers
            .send(AnswerEvaluate {
                questions_with_answers: qa,
            })
            .await;

        match result {
            Ok(v) => Some(v),
            Err(e) => {
                log::error!("Failed to evaluate questions: {e}");
                None
            }
        }
    }

    async fn stress_plan(&self, stress: stress::OverallRequest) -> Option<stress::OverallResponse> {
        let result = self.stress_plan.send(stress).await;

        match result {
            Ok(v) => Some(v),
            Err(e) => {
                log::error!("Failed to get stress plan: {e}");
                None
            }
        }
    }
}
