use asr_rs::Transcriber;
use common::{
    dto::{ASRSessionCreate, MQMessage},
    file_store::Store,
    mq,
    util::fail::Fail,
};
use rocket::tokio;

use crate::asr::{AudioStreamInput, run_asr};

#[allow(clippy::unwrap_used)]
pub async fn start_mq_listener(cfg: mq::Config, store: Store, asr: Transcriber) {
    let rabbit_mq = mq::Connection::for_config(cfg)
        .await
        .expect("connection should succeed");

    let mut listener = rabbit_mq
        .recieve::<ASRSessionCreate>(Some("start".to_owned()))
        .await
        .unwrap()
        .bind_exchange("asr_start".to_string(), "start".to_string())
        .await
        .unwrap();

    let mq_store = store.clone();
    let mq_transcriber = asr.clone();
    tokio::spawn(async move {
        while let Some(data) = listener.recv().await {
            let data = data.unwrap().get().await.unwrap();
            log::info!("got session start {data:?}");
            let session_id = data.session_id.to_string();

            let recv = rabbit_mq
                .recieve::<Vec<u8>>(None)
                .await
                .unwrap()
                .bind_exchange("audio".to_owned(), session_id.clone())
                .await
                .unwrap();

            let send = rabbit_mq
                .sender::<MQMessage>(&session_id, Some("asr".to_owned()))
                .await
                .unwrap();

            let mq_store = mq_store.clone();
            let mq_transcriber = mq_transcriber.clone();
            let audio_format = data.audio_format;
            let session_type = data.session_type;

            tokio::spawn(async move {
                run_asr(
                    AudioStreamInput::MQ(recv, send),
                    session_id,
                    audio_format,
                    session_type,
                    mq_transcriber.clone(),
                    mq_store.clone(),
                )
                .await
                .log_err("Error in ASR session");
            });
        }
    });
}
