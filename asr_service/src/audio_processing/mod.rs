use std::{path::PathBuf, sync::mpsc, thread};

#[cfg(feature = "ffmpeg")]
mod ffmpeg;

#[cfg(feature = "ffmpeg")]
use ffmpeg::audio_preprocessor;

#[cfg(feature = "rust_audio")]
mod rust;

#[cfg(feature = "rust_audio")]
pub use rust::AudioError;

#[cfg(feature = "rust_audio")]
use rust::audio_preprocessor;

#[cfg(all(feature = "ffmpeg", feature = "rust_audio"))]
compile_error!("ffmpeg and rust_audio are mutually exclusive and cannot be enabled together");
#[cfg(all(not(feature = "ffmpeg"), not(feature = "rust_audio")))]
compile_error!("One of the following features should be enabled: ffmpeg or rust_audio");

pub struct AudioPipe {
    pub audio_tx: mpsc::Sender<Vec<u8>>,
    pub samples_rx: mpsc::Receiver<Vec<f32>>,
}

pub struct AudioConfig {
    pub(crate) original: std::fs::File,
    pub(crate) converted: std::fs::File,

    pub(crate) audio_rx: mpsc::Receiver<Vec<u8>>,
    pub(crate) samples_tx: mpsc::Sender<Vec<f32>>,
}

impl AudioPipe {
    pub fn create(original_path: PathBuf, converted_path: PathBuf) -> AudioPipe {
        let (audio_tx, audio_rx) = mpsc::channel::<Vec<u8>>();
        let (samples_tx, samples_rx) = mpsc::channel::<Vec<f32>>();

        let cfg = AudioConfig {
            original: std::fs::File::create(original_path).unwrap(),
            converted: std::fs::File::create(converted_path).unwrap(),
            audio_rx,
            samples_tx,
        };

        thread::spawn(|| audio_preprocessor(cfg).unwrap());

        AudioPipe {
            audio_tx,
            samples_rx,
        }
    }
}
