use jwt::{Header, RegisteredClaims, VerifyWithKey};
use rocket::{
    Request,
    http::Status,
    request::{self, FromRequest},
};

use crate::app::fetch_public_key;

pub struct User {
    pub user_id: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = crate::error::Error;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        if let Some(cookie) = req.cookies().get("auth") {
            let key = fetch_public_key();
            let token: jwt::Token<Header, RegisteredClaims, _> =
                cookie.value().verify_with_key(&key).unwrap();
            let user_id = token.claims().subject.clone().unwrap();
            rocket::outcome::Outcome::Success(User { user_id })
        } else {
            rocket::outcome::Outcome::Forward(Status::Unauthorized)
        }
    }
}
