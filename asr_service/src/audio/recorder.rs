use common::file_store::Store;
use tempdir::TempDir;

use crate::error::Result;
use std::{
    fmt::Debug,
    fs::File,
    io::{BufWriter, Write},
};

use crate::audio::{AudioError, PipelineStep, TARGET_SAMPLE_RATE};

pub struct RecordAudio<P: PipelineStep> {
    next: P,

    original: BufWriter<File>,
    converted: hound::WavWriter<BufWriter<File>>,

    store: Store,
    prefix: String,
    recording_dir: TempDir,
    converted_path: std::path::PathBuf,
    original_path: std::path::PathBuf,
}

impl<P: PipelineStep> Debug for RecordAudio<P> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RecordAudio")
            .field("prefix", &self.prefix)
            .field("recording_dir", &self.recording_dir)
            .field("converted_path", &self.converted_path)
            .field("original_path", &self.original_path)
            .finish()
    }
}

impl<P: PipelineStep> RecordAudio<P> {
    pub fn new(next: P, store: Store, prefix: String) -> Result<RecordAudio<P>> {
        let recording_dir = TempDir::new("asr_recording").map_err(AudioError::Recording)?;
        let original_path = recording_dir.path().join("original");
        let converted_path = recording_dir.path().join("coverted.wav");

        let original_out =
            BufWriter::new(File::create(original_path.clone()).map_err(AudioError::Recording)?);

        let converted_out =
            BufWriter::new(File::create(converted_path.clone()).map_err(AudioError::Recording)?);

        let writer = hound::WavWriter::new(
            converted_out,
            hound::WavSpec {
                channels: 1,
                sample_rate: TARGET_SAMPLE_RATE as u32,
                bits_per_sample: 32,
                sample_format: hound::SampleFormat::Float,
            },
        )
        .map_err(AudioError::Hound)?;

        Ok(Self {
            converted: writer,
            original: original_out,
            original_path,
            converted_path,
            store,
            prefix,
            recording_dir,
            next,
        })
    }
}

impl<P: PipelineStep> PipelineStep for RecordAudio<P> {
    fn process_audio(&mut self, input: Vec<u8>) -> Result<Vec<f32>> {
        self.original.write(&input).map_err(AudioError::Recording)?;

        let output = self.next.process_audio(input)?;

        for sample in &output {
            self.converted
                .write_sample(*sample)
                .map_err(AudioError::Hound)?;
        }

        return Ok(output);
    }

    async fn finish(self) -> Result<Option<Vec<f32>>> {
        let result = self.next.finish().await;

        let upload_path = format!("{}/original", self.prefix);
        self.store
            .upload_file(upload_path, self.original_path)
            .await?;

        let upload_path = format!("{}/converted.wav", self.prefix);
        self.store
            .upload_file(upload_path, self.converted_path)
            .await?;

        drop(self.recording_dir);

        log::info!("Recodings uploaded successfully to {}", self.prefix);

        result
    }
}
