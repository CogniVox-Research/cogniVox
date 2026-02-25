use crate::error::Result;
use rocket::tokio::task::spawn_blocking;
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

mod error;
use common::file_store::Store;
pub use error::AudioError;
mod recorder;

#[cfg(feature = "ffmpeg")]
mod ffmpeg;

#[cfg(feature = "ffmpeg")]
use ffmpeg::audio_preprocessor;

#[cfg(feature = "rust_audio")]
mod rust;

#[cfg(feature = "rust_audio")]
use rust::WebmAudioDecoder;

#[cfg(all(feature = "ffmpeg", feature = "rust_audio"))]
compile_error!("ffmpeg and rust_audio are mutually exclusive and cannot be enabled together");
#[cfg(all(not(feature = "ffmpeg"), not(feature = "rust_audio")))]
compile_error!("One of the following features should be enabled: ffmpeg or rust_audio");

pub const TARGET_SAMPLE_RATE: usize = 16_000;

pub struct AudioPipe {
    ends: Option<(mpsc::Sender<Vec<u8>>, mpsc::Receiver<Vec<f32>>)>,
    pipeline: Arc<Mutex<recorder::RecordAudio<WebmAudioDecoder>>>,
    task_thread: thread::JoinHandle<()>,
}

pub trait PipelineStep {
    fn process_audio(&mut self, input: Vec<u8>) -> Result<Vec<f32>>;
    async fn finish(self) -> Result<Option<Vec<f32>>>;
}

impl AudioPipe {
    pub fn create(store: Store, prefix: String) -> Result<AudioPipe> {
        let (audio_tx, audio_rx) = mpsc::channel::<Vec<u8>>();
        let (samples_tx, samples_rx) = mpsc::channel::<Vec<f32>>();

        let pipeline = WebmAudioDecoder::new();
        let pipeline = recorder::RecordAudio::new(pipeline, store, prefix)?;
        let pipeline = Arc::new(Mutex::new(pipeline));

        let thread_pipeline = pipeline.clone();
        let task_thread = thread::spawn(move || {
            while let Ok(chunk) = audio_rx.recv() {
                let result = thread_pipeline
                    .lock()
                    .expect("valid lock")
                    .process_audio(chunk);

                match result {
                    Ok(samples) => {
                        log::debug!("Received {} samples", samples.len());
                        if samples_tx.send(samples).is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        log::error!("Audio pipeline error {e}");
                        break;
                    }
                }
            }
        });

        Ok(AudioPipe {
            ends: Some((audio_tx, samples_rx)),
            task_thread,
            pipeline,
        })
    }

    pub fn get_ends(&mut self) -> (mpsc::Sender<Vec<u8>>, mpsc::Receiver<Vec<f32>>) {
        self.ends
            .take()
            .expect("get ends should be called only once")
    }

    pub async fn finish(self) -> Result<()> {
        spawn_blocking(|| self.task_thread.join())
            .await
            .expect("thread join success")
            .expect("thread join success");
        log::debug!("Audio pipeline thread exit");

        let pipeline = Arc::try_unwrap(self.pipeline).expect("this should be the only arc ref");

        let pipeline = pipeline.into_inner().expect("lock should not be poisoned");

        pipeline.finish().await?;
        log::debug!("Pipeline shutdown");

        Ok(())
    }
}
