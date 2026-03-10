use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CVQuestions {
    pub cv_text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeechQuestions {
    pub speech_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuestionResponse {
    pub questions_and_answers: Vec<Question>,
    pub total_questions: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Question {
    pub question: String,
    pub sample_answer: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Continue {
    pub continuation_hint: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnswerEvaluateItem {
    pub question: String,
    pub sample_answer: String,
    pub user_answer: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnswerEvaluate {
    pub questions_with_answers: Vec<AnswerEvaluateItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvaluateResult {
    pub overall_score: f64,
    pub results: Vec<AnswerEvaluateItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvaluateResultItem {
    pub question: String,
    pub matching_percentage: f64,
    pub is_matching: bool,
}
