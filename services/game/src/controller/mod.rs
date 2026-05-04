mod devices;
mod guard;
mod session;

pub fn route_list() -> Vec<rocket::Route> {
    routes![
        session::web_session,
        session::game_session,
        session::test_game_session,
        devices::get_devices,
        devices::vr_device,
    ]
}
