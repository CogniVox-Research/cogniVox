use std::marker::PhantomData;

use serde::{Serialize, de::DeserializeOwned};

use crate::{dto, error};

#[derive(Debug)]
pub struct Endpoints {
    pub transcript: APIRequest<dto::transcript::Request, dto::transcript::Response>,
    pub speech_score: APIRequest<dto::sds::Request, dto::sds::Response>,
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
        let body = self.client.post(&self.url).json(&data).send().await?;
        Ok(body.json().await?)
    }
}
