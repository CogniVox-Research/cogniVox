use rocket::tokio;

use crate::error::Error;

/// runs the given websocket handler future in a tokio::task.
/// If the task returns an error, it will be logged.
pub fn websocket_task<F>(future: F)
where
    F: Future<Output = Result<(), Error>> + Send + 'static,
{
    tokio::spawn(async move {
        let result = future.await;
        match result {
            Ok(_) => (),
            Err(e) => {
                log::error!("Websocket Error: {e}")
            }
        }
    });
}
