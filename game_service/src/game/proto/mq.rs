use common::{
    dto::ASRSessionCreate,
    mq::{self, Message, Sender},
};

use crate::{dto::stress::StressRequest, error::Result, game::proto::ServiceInbound};

pub struct MQSession {
    session_id: uuid::Uuid,
    audio_tx: mq::Sender<Vec<u8>>,
    stress_tx: mq::Sender<StressRequest>,
    result_rx: mq::Consumer<super::ServiceInbound>,
}

impl MQSession {
    pub async fn new(con: &mq::Connection, session_id: uuid::Uuid) -> Result<Self> {
        let session_id_str = session_id.to_string();
        let audio_tx = con
            .sender(&session_id_str, Some("audio".to_owned()))
            .await?;
        let stress_tx = con
            .sender(&session_id_str, Some("stress".to_owned()))
            .await?;

        let result_rx = con
            .recieve(None)
            .await?
            .bind_exchange("asr".to_owned(), session_id_str.clone())
            .await?
            .bind_exchange("results".to_owned(), session_id_str.to_owned())
            .await?;

        Ok(Self {
            session_id,
            audio_tx,
            stress_tx,
            result_rx,
        })
    }

    pub fn recv(
        &mut self,
    ) -> impl Future<Output = Option<Result<Message<ServiceInbound>, mq::MQError>>> {
        self.result_rx.recv()
    }

    pub async fn send_audio(&self, audio: Vec<u8>) -> Result<()> {
        self.audio_tx.send(audio).await?;
        Ok(())
    }

    pub async fn send_stress_metrics(&self, stress: StressRequest) -> Result<()> {
        self.stress_tx.send(stress).await?;
        Ok(())
    }

    pub async fn create_asr_session(&self, session_queue: &Sender<ASRSessionCreate>) -> Result<()> {
        session_queue
            .send(ASRSessionCreate {
                session_id: self.session_id,
                audio_format: "pcm".to_owned(),
            })
            .await?;

        Ok(())
    }
}
