mod handlers;
#[cfg(test)]
mod handlers_test;
mod models;
#[cfg(test)]
mod integration_test;
mod routes;
mod service;

use actix_web::{web, App, HttpServer};
use service::TodoService;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize the service
    let todo_service = web::Data::new(TodoService::new());

    println!("🌶️  Spicy Todo API (Rust/Actix) running on http://localhost:8000");

    HttpServer::new(move || {
        App::new()
            .wrap(routes::configure_cors())
            .app_data(todo_service.clone())
            .configure(routes::configure_routes)
    })
    .bind("0.0.0.0:8000")?
    .run()
    .await
}
