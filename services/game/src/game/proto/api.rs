use std::{marker::PhantomData, time::Duration};

use serde::{Serialize, de::DeserializeOwned};

use crate::{config, dto, error};

#[derive(Debug)]
pub struct Endpoints {
    pub transcript: APIRequest<dto::transcript::Request, dto::transcript::Response>,
    pub speech_score: APIRequest<dto::sds::Request, dto::sds::Response>,
    pub interview_question: APIRequest<dto::llm::CVQuestions, dto::llm::QuestionResponse>,
    pub speech_question: APIRequest<dto::llm::SpeechQuestions, dto::llm::QuestionResponse>,
    pub evaluate_answers: APIRequest<dto::llm::AnswerEvaluate, dto::llm::EvaluateResult>,
    pub stress_plan: APIRequest<dto::stress::OverallRequest, dto::stress::OverallResponse>,
}

impl Endpoints {
    pub fn from_config(url: &config::URL) -> Self {
        let request_client = reqwest::Client::new();

        Endpoints {
            transcript: APIRequest::new(request_client.clone(), url.transcript_analysis.clone()),
            speech_score: APIRequest::new(request_client.clone(), url.sds_service.clone()),
            interview_question: APIRequest::new(
                request_client.clone(),
                format!("{}/{}", url.llm.base, url.llm.interview_question),
            ),
            speech_question: APIRequest::new(
                request_client.clone(),
                format!("{}/{}", url.llm.base, url.llm.speech_question),
            ),
            evaluate_answers: APIRequest::new(
                request_client.clone(),
                format!("{}/{}", url.llm.base, url.llm.evaluate),
            ),
            stress_plan: APIRequest::new(
                request_client.clone(),
                format!("{}/{}", url.llm.base, url.llm.stress_management),
            ),
        }
    }
}

#[derive(Debug, Clone)]
pub struct APIRequest<In: Serialize, Out: DeserializeOwned> {
    url: String,
    client: reqwest::Client,
    _in_type: PhantomData<In>,
    _out_type: PhantomData<Out>,
}

impl<In: Serialize, Out: DeserializeOwned> APIRequest<In, Out> {
    pub fn new(client: reqwest::Client, url: String) -> Self {
        return APIRequest {
            url,
            client,
            _in_type: PhantomData,
            _out_type: PhantomData,
        };
    }

    pub async fn send(&self, data: In) -> error::Result<Out> {
        let body = self
            .client
            .post(&self.url)
            .timeout(Duration::from_secs(120))
            .json(&data)
            .send()
            .await?;
        Ok(body.json().await?)
    }
}
