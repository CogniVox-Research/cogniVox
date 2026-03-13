use jwt::{Header, RegisteredClaims, VerifyWithKey};
use rocket::{
    Request,
    http::Status,
    outcome::Outcome,
    request::{self, FromRequest},
};

use crate::{
    app::get_public_key,
    error::{Error, Result},
};

#[derive(Debug)]
pub struct User {
    pub user_id: String,
    pub username: String,
}

impl User {
    pub fn from_token(token_str: &str) -> Result<User> {
        let key = get_public_key();
        let token: jwt::Token<Header, RegisteredClaims, _> = token_str.verify_with_key(&key)?;
        let user_id = token.claims().subject.clone().ok_or(Error::NoUserId)?;

        Ok(User {
            user_id,
            username: "Test User".to_owned(),
        })
    }

    pub fn from_request(req: &Request<'_>) -> Result<Option<User>> {
        req.cookies()
            .get("auth")
            .map(|cookie| Self::from_token(cookie.value()))
            .transpose()
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = &'static str;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        match User::from_request(req) {
            Ok(Some(user)) => Outcome::Success(user),
            Ok(None) => Outcome::Error((Status::BadRequest, "Missing auth token")),
            Err(e) => {
                log::error!("Error parsing auth token: {e}");
                Outcome::Error((Status::InternalServerError, "Invalid auth token"))
            }
        }
    }
}
