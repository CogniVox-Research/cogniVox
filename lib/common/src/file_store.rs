use std::{ops::Deref, os::unix::fs::MetadataExt, path::PathBuf, sync::Arc};

use bytes::Bytes;
use object_store::{ObjectStoreExt, PutPayload, path::Path};
use serde::Deserialize;
use tokio::{
    fs,
    io::{AsyncRead, AsyncReadExt},
};

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("Failed to create store: {0}")]
    Create(object_store::Error),

    #[error(transparent)]
    IO(#[from] std::io::Error),

    #[error("Failed to upload file {0} to store: {1}")]
    Upload(object_store::path::Path, object_store::Error),

    #[error("Failed to read file {0}: {1}")]
    Read(object_store::path::Path, object_store::Error),

    #[error("File Not found: {0}")]
    NotFound(object_store::path::Path),

    #[error(transparent)]
    NotUtf8(#[from] std::string::FromUtf8Error),
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum StoreConfig {
    InMemory,
    Local {
        path: PathBuf,
    },
    S3 {
        endpoint: String,
        bucket: String,
        access_key_id: String,
        secret_access_key: String,
    },
}

#[derive(Clone)]
pub enum Store {
    InMemory(Arc<object_store::memory::InMemory>),
    Local(Arc<object_store::local::LocalFileSystem>),
    S3(Arc<object_store::aws::AmazonS3>),
}

impl Store {
    /// Creates a new store for the given config
    ///
    /// # Errors
    /// Returns an error if creating/connecting to the store failed
    pub fn from_config(cfg: &StoreConfig) -> Result<Store, StoreError> {
        let store = match cfg {
            StoreConfig::InMemory => {
                Store::InMemory(Arc::new(object_store::memory::InMemory::new()))
            }
            StoreConfig::Local { path } => {
                if !path.exists() {
                    std::fs::create_dir_all(path)?;
                }
                let ls = object_store::local::LocalFileSystem::new_with_prefix(path)
                    .map_err(StoreError::Create)?;
                Store::Local(Arc::new(ls))
            }
            StoreConfig::S3 {
                endpoint,
                bucket,
                access_key_id,
                secret_access_key,
            } => {
                let s3 = object_store::aws::AmazonS3Builder::new()
                    .with_allow_http(true)
                    .with_endpoint(endpoint)
                    .with_access_key_id(access_key_id)
                    .with_secret_access_key(secret_access_key)
                    .with_bucket_name(bucket)
                    .build()
                    .map_err(StoreError::Create)?;

                Store::S3(Arc::new(s3))
            }
        };

        Ok(store)
    }

    /// Reads the contents at the given path as a string.
    ///
    /// # Errors
    ///
    /// Returns an `StoreError::NotFound` error if the path does not exists.
    /// Retuns an `StoreError::Read` if an error occured while reading the data.
    /// Returns `StoreError::NotUtf8` if the data is not a valid utf-8 string
    pub async fn read_str(&self, path: &str) -> Result<String, StoreError> {
        Ok(String::from_utf8(self.read(path).await?)?)
    }

    /// Reads the contents at the given path as a bytes.
    ///
    /// # Errors
    ///
    /// Returns an `StoreError::NotFound` error if the path does not exists.
    /// Retuns an `StoreError::Read` if an error occured while reading the data.
    /// Returns `StoreError::NotUtf8` if the data is not a valid utf-8 string
    pub async fn read(&self, path: &str) -> Result<Vec<u8>, StoreError> {
        let path = Path::from(path);

        let file = match self.get(&path).await {
            Ok(v) => v,
            Err(object_store::Error::NotFound { path: _, source: _ }) => {
                return Err(StoreError::NotFound(path));
            }
            Err(e) => return Err(StoreError::Read(path, e)),
        };

        let bytes = file.bytes().await.map_err(|e| StoreError::Read(path, e))?;

        Ok(bytes.to_vec())
    }

    /// Uplods the file at the given path
    ///
    /// # Errors
    /// Returns an `StoreError::Upload` error if the upload fails.
    pub async fn upload_file(&self, path: &str, file_path: PathBuf) -> Result<(), StoreError> {
        let file = fs::File::open(file_path).await?;
        let metadata = file.metadata().await?;

        let size = metadata.size();
        self.upload_from_reader(path, file, Some(size)).await
    }

    /// Uplods the content in the given reader.
    ///
    /// # Errors
    /// Returns an `StoreError::Upload` error if the upload fails.
    #[allow(
        clippy::cast_possible_truncation,
        reason = "read_to_end will panic if the size exceeds 4GB on 32bit platforms"
    )]
    pub async fn upload_from_reader<T>(
        &self,
        path: &str,
        mut reader: T,
        size: Option<u64>,
    ) -> Result<(), StoreError>
    where
        T: AsyncRead + Unpin,
    {
        let size = size.unwrap_or(1000);
        let mut data = Vec::with_capacity(size as usize);
        reader.read_to_end(&mut data).await?;

        // TODO: use multipart for large files

        self.upload(path, data).await
    }

    /// Uplods the given bytes.
    ///
    /// # Errors
    /// Returns an `StoreError::Upload` error if the upload fails.
    pub async fn upload(&self, path: &str, data: Vec<u8>) -> Result<(), StoreError> {
        let upload_path = object_store::path::Path::from(path);

        let result = self
            .put(&upload_path, PutPayload::from_bytes(Bytes::from(data)))
            .await;

        if let Err(err) = result {
            return Err(StoreError::Upload(upload_path, err));
        }

        Ok(())
    }
}

impl Deref for Store {
    type Target = dyn object_store::ObjectStore;

    fn deref(&self) -> &Self::Target {
        match self {
            Store::InMemory(in_memory) => in_memory,
            Store::Local(local) => local,
            Self::S3(s3) => s3,
        }
    }
}
