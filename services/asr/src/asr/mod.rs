use common::{
    dto::{ASRSessionType, AudioFormat},
    file_store::Store,
};

use rocket::tokio::task::block_in_place;
mod input_stream;
pub use input_stream::AudioStreamInput;

use crate::{audio, dto::TranscriptionResult, error};

pub(crate) async fn run_asr(
    mut input: input_stream::AudioStreamInput,
    session_id: String,
    audio_format: AudioFormat,
    session_type: ASRSessionType,
    transcriber: asr_rs::Transcriber,
    store: Store,
) -> error::Result<()> {
    let prefix = format!("{session_id}/recordings");
    let mut audio_pipeline = audio::Pipeline::new(store, &audio_format, prefix)?;

    let ts = transcriber.create_async_stream().await?;

    while let Some(chunk) = input.next_chunk().await? {
        let samples = block_in_place(|| audio_pipeline.process_audio(chunk))?;

        let transcript = ts.transcribe_audio(samples).await?;

        input
            .send_result(TranscriptionResult::new(
                &session_id,
                transcript,
                session_type,
            ))
            .await?;
    }

    let recording_file = audio_pipeline.recording_file();

    let final_sample = audio_pipeline.finish().await?;
    let transcript = ts.finish_transcribing(final_sample).await?;

    input
        .send_result(TranscriptionResult::new_complete(
            &session_id,
            recording_file,
            transcript,
            session_type,
        ))
        .await?;

    Ok(())
}
