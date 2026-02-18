use std::{path::PathBuf, sync::mpsc, thread};

#[cfg(feature = "ffmpeg")]
mod ffmpeg;

#[cfg(feature = "ffmpeg")]
use ffmpeg::audio_preprocessor;

#[cfg(feature = "symphonia")]
mod symphonia;

#[cfg(feature = "symphonia")]
use symphonia::audio_preprocessor;

pub struct AudioPipe {
    pub audio_tx: mpsc::Sender<Vec<u8>>,
    pub samples_rx: mpsc::Receiver<Vec<f32>>,
}

pub struct AudioConfig {
    pub(crate) original_path: PathBuf,
    pub(crate) converted_path: PathBuf,

    pub(crate) audio_rx: mpsc::Receiver<Vec<u8>>,
    pub(crate) samples_tx: mpsc::Sender<Vec<f32>>,
}

impl AudioPipe {
    pub fn create(original_path: PathBuf, converted_path: PathBuf) -> AudioPipe {
        let (audio_tx, audio_rx) = mpsc::channel::<Vec<u8>>();
        let (samples_tx, samples_rx) = mpsc::channel::<Vec<f32>>();

        let cfg = AudioConfig {
            original_path,
            converted_path,
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
