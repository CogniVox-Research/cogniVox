use std::io::Cursor;

use byteorder::{LittleEndian, ReadBytesExt};

use crate::audio::PipelineStep;

pub struct PCM32FDecoder {}

impl PipelineStep for PCM32FDecoder {
    fn process_audio(&mut self, input: Vec<u8>) -> crate::error::Result<Vec<f32>> {
        let mut cursor = Cursor::new(&input);
        let mut floats = Vec::with_capacity(input.len() / 4);

        while let Ok(n) = cursor.read_f32::<LittleEndian>() {
            floats.push(n);
        }

        Ok(floats)
    }

    async fn finish(self) -> crate::error::Result<Option<Vec<f32>>> {
        Ok(None)
    }
}
