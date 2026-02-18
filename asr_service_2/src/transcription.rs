use rocket::tokio::sync::mpsc;

use crate::error::Result;

pub fn start_transcription(
    model_config: asr_rs::whisper::Config,
    samples_rx: std::sync::mpsc::Receiver<Vec<f32>>,
) -> mpsc::Receiver<asr_rs::Result<asr_rs::Transcription>> {
    let (result_tx, result_rx) = mpsc::channel(100);

    std::thread::spawn(move || -> Result<()> {
        let mut ts = asr_rs::StreamTranscriber::create(asr_rs::Backend::Whisper(model_config))?;

        let mut sample_buffer = Vec::with_capacity(16000);
        while let Ok(mut samples) = samples_rx.recv() {
            sample_buffer.append(&mut samples);

            while let Ok(mut samples) = samples_rx.try_recv() {
                sample_buffer.append(&mut samples);
            }

            if sample_buffer.len() >= 16000 {
                let result = ts.transcribe_audio(sample_buffer);
                sample_buffer = Vec::with_capacity(16000);

                if result_tx.blocking_send(result).is_err() {
                    break;
                }
            }
        }

        if !sample_buffer.is_empty() {
            let _ = ts.transcribe_audio(sample_buffer);
        }

        let result = ts.finish_transcribing();
        let _ = result_tx.send(result);

        Ok(())
    });

    result_rx
}
