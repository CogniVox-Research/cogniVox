mod api;
pub mod messages;
mod mq;
mod ws;

pub use api::*;
pub(crate) use messages::*;
pub use mq::*;
pub use ws::*;

pub type WebConnection = WebSocket<WebInbound, WebOutbound>;
pub type GameConnection = WebSocket<GameInbound, GameOutbound>;
pub type DeviceConnection = WebSocket<DeviceInbound, DeviceOutbound>;
