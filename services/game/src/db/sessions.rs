use common::util::fail::Fail;
use mongodb::{
    Client, Collection, bson::{ self, doc}
};
use crate::error::Error;

use super::models::SessionModel;

pub struct SessionRepo {
    col: Collection<SessionModel>,
}

impl SessionRepo {
    pub async fn init(uri: String) -> Self {
        let client = Client::with_uri_str(uri).await.fail("Cannot connect to mongodb");
        let db = client.database("cg_sessions");
        let col: Collection<SessionModel> = db.collection("sessions");
        SessionRepo { col }
    }

    pub async fn insert_session(&self, s: SessionModel) -> Result<(), Error> {
        self.col.insert_one(s).await?;
            Ok(())

    }

    pub async fn get_all_sessions(&self) -> Result<Vec<SessionModel>, Error> {
        let mut cursor = self
            .col
            .find(doc! {})
            .await
            .map_err(|e| bson::extjson::de::Error::DeserializationError { message: e.to_string() })?;

        let mut sessions: Vec<SessionModel> = Vec::new();
        while cursor.advance().await.map_err(|e| bson::extjson::de::Error::DeserializationError { message: e.to_string() })? {
            match cursor.deserialize_current() {
                Ok(restaurant) => sessions.push(restaurant),
                Err(e) => {
                    eprintln!("Warning: Skipping document due to deserialization error: {}", e);
                    continue;
                }
            }
        }
        Ok(sessions)
    }


}
