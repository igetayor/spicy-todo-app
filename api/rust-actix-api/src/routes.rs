use crate::handlers;
use actix_cors::Cors;
use actix_web::web;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Root routes
        .route("/", web::get().to(handlers::root))
        .route("/health", web::get().to(handlers::health))
        // API routes
        .service(
            web::scope("/api")
                .route("/todos", web::get().to(handlers::get_todos))
                .route("/todos", web::post().to(handlers::create_todo))
                .route("/todos/{id}", web::get().to(handlers::get_todo))
                .route("/todos/{id}", web::put().to(handlers::update_todo))
                .route("/todos/{id}", web::delete().to(handlers::delete_todo))
                .route("/todos/{id}/toggle", web::patch().to(handlers::toggle_todo))
                .route("/todos/stats/summary", web::get().to(handlers::get_stats))
                .route("/todos/completed", web::delete().to(handlers::clear_completed)),
        );
}

pub fn configure_cors() -> Cors {
    Cors::default()
        .allowed_origin("http://localhost:3000")
        .allowed_origin("http://127.0.0.1:3000")
        .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
        .allowed_headers(vec![
            actix_web::http::header::CONTENT_TYPE,
            actix_web::http::header::ACCEPT,
        ])
        .max_age(3600)
}

