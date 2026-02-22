use crate::ws::{GameConnection, WebConnection};

pub enum GameState {
    Waiting,
    Speech,
    Question,
}

pub struct Game {
    game: GameConnection,
    web: WebConnection,
}

impl GameState {}
