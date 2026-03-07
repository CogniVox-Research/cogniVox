use jwt::{Header, RegisteredClaims, VerifyWithKey};
use rocket::{
    Request,
    http::Status,
    request::{self, FromRequest},
};

use crate::app::get_public_key;

pub struct User {
    pub user_id: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = crate::error::Error;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        if let Some(cookie) = req.cookies().get("auth") {
            let key = get_public_key();
            let token: jwt::Token<Header, RegisteredClaims, _> =
                cookie.value().verify_with_key(&key).unwrap();
            let user_id = token.claims().subject.clone().unwrap();
            rocket::outcome::Outcome::Success(User { user_id })
        } else {
            // FIXME: hardcoded user id
            rocket::outcome::Outcome::Success(User {
                user_id: "1".to_owned(),
            })
            // rocket::outcome::Outcome::Forward(Status::Unauthorized)
        }
    }
}
