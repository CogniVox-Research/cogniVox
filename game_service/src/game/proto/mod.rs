pub mod messages;
mod web;
mod ws;

pub(crate) use messages::*;
pub use web::*;
pub use ws::*;

pub type WebConnection = WebSocket<WebInbound, WebOutbound>;
pub type GameConnection = WebSocket<GameInbound, GameOutbound>;
