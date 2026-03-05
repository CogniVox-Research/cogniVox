use rocket_ws::Message;
use serde::{Deserialize, Serialize};

use crate::{
    dto::settings::DeviceInfo,
    error::{Error, Result},
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum DeviceInbound {
    Connect(DeviceInfo),
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum DeviceOutbound {
    Ok {
        user_name: String,
        device_id: uuid::Uuid,
    },
    Join {
        session_id: uuid::Uuid,
    },
}

impl super::Inbound for DeviceInbound {
    fn from_message(value: Message) -> Result<Self> {
        match value {
            Message::Text(text) => serde_json::de::from_str(&text).map_err(Error::Deserialize),
            Message::Pong(items) => Err(Error::SocketPong(items)),
            Message::Close(_) => Err(Error::SocketClose),
            _ => Err(Error::UnexpectedMessage(value)),
        }
    }
}

impl super::Outbound for DeviceOutbound {
    fn into_message(self) -> Result<Message> {
        let data = serde_json::ser::to_string(&self).map_err(Error::Serialize)?;
        Ok(Message::Text(data))
    }
}
