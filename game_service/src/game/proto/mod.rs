mod connection;
pub mod messages;

pub use connection::*;
pub(crate) use messages::*;

pub type WebConnection = WebSocket<WebInbound, WebOutbound>;
pub type GameConnection = WebSocket<GameInbound, GameOutbound>;
