use asr_rs::Transcriber;
use common::{
    dto::{ASRSessionCreate, MQMessage},
    file_store::Store,
    mq::{self, Consumer, ExchageType, MQError},
    util::fail::Fail,
};
use rocket::tokio;

use crate::asr::{AudioStreamInput, run_asr};

pub struct MQListener {
    store: Store,
    asr: Transcriber,
    consumer: Consumer<ASRSessionCreate>,
    connection: mq::Connection,
}

pub async fn start_mq_listener(cfg: mq::Config, store: Store, asr: Transcriber) {
    let connection = mq::Connection::from_config(cfg)
        .await
        .fail("Failed to connect to message queue");

    connection
        .declare_exchange(ExchageType::Direct, "asr_start")
        .await
        .fail("Failed to create asr_start mq");

    let consumer = connection
        .consumer::<ASRSessionCreate>()
        .queue_name("start")
        .on_exchange("asr_start", "start")
        .connect()
        .await
        .fail("Failed to connect to start queue");

    let mut listener = MQListener {
        store,
        asr,
        consumer,
        connection,
    };

    tokio::spawn(async move { listener.start().await });
}

impl MQListener {
    async fn start(&mut self) {
        while let Some(data) = self.consumer.recv_ack().await {
            log::info!("Got new session {data:?}");
            self.create_session(data)
                .await
                .log_err("Failed to create asr session");
        }
    }

    async fn create_session(
        &self,
        message: Result<ASRSessionCreate, MQError>,
    ) -> Result<(), MQError> {
        let data = message?;

        log::info!("got session start {data:?}");
        let session_id = data.session_id.to_string();

        let recv = self
            .connection
            .consumer()
            .on_exchange("audio", &session_id)
            .connect()
            .await?;

        let send = self
            .connection
            .sender::<MQMessage>(&session_id, Some("asr".to_owned()));

        let store = self.store.clone();
        let transcriber = self.asr.clone();
        tokio::spawn(async move {
            run_asr(
                AudioStreamInput::MQ(recv, send),
                session_id,
                data.audio_format,
                data.session_type,
                transcriber.clone(),
                store.clone(),
            )
            .await
            .log_err("Error in ASR session");
        });

        Ok(())
    }
}
