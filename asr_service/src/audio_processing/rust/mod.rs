mod custom;
mod error;
mod header;

pub const TARGET_SAMPLE_RATE: usize = 16_000;

pub use custom::*;
pub use error::*;
pub(self) use header::*;
