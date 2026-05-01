use std::env;
use mongodb::{
    bson::{extjson::de::Error, doc},
    Client, Collection
};
use super::models::SessionModel;

pub struct MongoRepo {
    col: Collection<SessionModel>,
}

impl MongoRepo {
    pub async fn init(uri: String) -> Self {
        let client = Client::with_uri_str(uri).await.unwrap();
        let db = client.database("cg_sessions");
        let col: Collection<SessionModel> = db.collection("sessions");
        MongoRepo { col }
    }

    pub async fn get_all_sessions(&self) -> Result<Vec<SessionModel>, Error> {
        let mut cursor = self
            .col
            .find(doc! {})
            .await
            .map_err(|e| Error::DeserializationError { message: e.to_string() })?;

        let mut restaurants: Vec<SessionModel> = Vec::new();
        while cursor.advance().await.map_err(|e| Error::DeserializationError { message: e.to_string() })? {
            match cursor.deserialize_current() {
                Ok(restaurant) => restaurants.push(restaurant),
                Err(e) => {
                    eprintln!("Warning: Skipping document due to deserialization error: {}", e);
                    continue;
                }
            }
        }
        Ok(restaurants)
    }


}
