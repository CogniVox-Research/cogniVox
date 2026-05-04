use std::marker::PhantomData;

use serde::de::DeserializeOwned;

use crate::mq::{self, Consumer};

#[derive(Debug)]
pub struct ConsumerBuilder<T: DeserializeOwned> {
    con: mq::Connection,
    queue_name: Option<String>,
    exchanges: Vec<(String, String)>,
    _type: PhantomData<T>,
}

impl<T: DeserializeOwned> ConsumerBuilder<T> {
    pub(crate) fn new(con: mq::Connection) -> Self {
        Self {
            con,
            queue_name: None,
            exchanges: vec![],
            _type: PhantomData,
        }
    }

    pub fn queue_name(mut self, s: &str) -> Self {
        self.queue_name = Some(s.to_owned());
        self
    }

    pub fn on_exchange(mut self, exhange: &str, key: &str) -> Self {
        self.exchanges.push((exhange.to_owned(), key.to_owned()));
        self
    }

    #[allow(deprecated)]
    pub async fn connect(self) -> Result<mq::Consumer<T>, mq::MQError> {
        let mut consumer = Consumer::create(self.con, self.queue_name).await?;
        for (exchange, route_key) in self.exchanges {
            consumer = consumer.bind_exchange(exchange, route_key).await?;
        }

        Ok(consumer)
    }
}
