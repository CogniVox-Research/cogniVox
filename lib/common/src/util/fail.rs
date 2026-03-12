use std::{fmt::Display, process::exit};

/// Utilities for working with Results.
pub trait Fail<T> {
    /// Unwraps the result and returns the Ok variant.
    /// If the result is an error, the program will exit after displaying the given message
    fn fail(self, msg: &str) -> T;

    /// unwraps and discards the content of the Ok variant.
    /// If the result is an error, an error message will be logged.
    fn log_err(self, msg: &str);
}

impl<T, E> Fail<T> for Result<T, E>
where
    E: Display,
{
    fn fail(self, msg: &str) -> T {
        match self {
            Ok(data) => data,
            Err(err) => {
                println!("{msg}");
                println!("Error: {err}");
                exit(1)
            }
        }
    }

    fn log_err(self, msg: &str) {
        if let Err(e) = self {
            log::error!("{msg}: {e}");
        }
    }
}
