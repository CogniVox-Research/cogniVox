use std::{ops::Deref, os::unix::fs::MetadataExt, path::PathBuf, sync::Arc};

use bytes::Bytes;
use object_store::{ObjectStoreExt, PutPayload};
use rocket::tokio::{fs, io::AsyncReadExt};

use crate::{
    config,
    error::{Error, Result},
};

#[derive(Clone)]
pub enum RecordingStore {
    InMemory(Arc<object_store::memory::InMemory>),
    Local(Arc<object_store::local::LocalFileSystem>),
}

impl RecordingStore {
    pub fn from_config(cfg: &config::StoreMode) -> RecordingStore {
        match cfg {
            config::StoreMode::InMemory => {
                RecordingStore::InMemory(Arc::new(object_store::memory::InMemory::new()))
            }
            config::StoreMode::Local { path } => RecordingStore::Local(Arc::new(
                object_store::local::LocalFileSystem::new_with_prefix(path)
                    .expect("store creation should succeed"),
            )),
            config::StoreMode::S3 => todo!(),
        }
    }

    pub async fn upload_file(&self, path: String, file_path: PathBuf) -> Result<()> {
        let mut file = fs::File::open(file_path).await.map_err(Error::Recording)?;
        let metadata = file.metadata().await.map_err(Error::Recording)?;

        let size = metadata.size();
        let mut data = Vec::with_capacity(size as usize);
        file.read_to_end(&mut data)
            .await
            .map_err(Error::Recording)?;

        // TODO: use multipart for large files

        let upload_path = object_store::path::Path::from(path);

        self.put(&upload_path, PutPayload::from_bytes(Bytes::from(data)))
            .await?;

        Ok(())
    }
}

impl Deref for RecordingStore {
    type Target = dyn object_store::ObjectStore;

    #[inline(always)]
    fn deref(&self) -> &Self::Target {
        match self {
            RecordingStore::InMemory(in_memory) => in_memory,
            RecordingStore::Local(local) => local,
        }
    }
}
