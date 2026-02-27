mod api;
pub mod messages;
mod ws;

pub use api::*;
pub(crate) use messages::*;
pub use ws::*;

pub type WebConnection = WebSocket<WebInbound, WebOutbound>;
pub type GameConnection = WebSocket<GameInbound, GameOutbound>;
