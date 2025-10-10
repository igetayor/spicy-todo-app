use crate::models::{TodoCreate, TodoQuery, TodoUpdate};
use crate::service::TodoService;
use actix_web::{web, HttpResponse, Responder};

pub async fn root() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "🌶️ Spicy Todo API - Rust/Actix Implementation",
        "version": "1.0.0",
        "docs": "/api/todos"
    }))
}

pub async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "spicy-todo-rust-api",
        "uptime": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn get_todos(
    service: web::Data<TodoService>,
    query: web::Query<TodoQuery>,
) -> impl Responder {
    let todos = service.get_all(
        query.filter.clone(),
        query.search.clone(),
        query.priority.clone(),
    );
    HttpResponse::Ok().json(todos)
}

pub async fn get_todo(
    service: web::Data<TodoService>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();

    match service.get_by_id(&id) {
        Some(todo) => HttpResponse::Ok().json(todo),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        })),
    }
}

pub async fn create_todo(
    service: web::Data<TodoService>,
    todo_create: web::Json<TodoCreate>,
) -> impl Responder {
    if todo_create.text.trim().is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Todo text is required"
        }));
    }

    if todo_create.text.len() > 500 {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Todo text must be less than 500 characters"
        }));
    }

    let todo = service.create(todo_create.into_inner());
    HttpResponse::Created().json(todo)
}

pub async fn update_todo(
    service: web::Data<TodoService>,
    path: web::Path<String>,
    todo_update: web::Json<TodoUpdate>,
) -> impl Responder {
    let id = path.into_inner();

    match service.update(&id, todo_update.into_inner()) {
        Some(todo) => HttpResponse::Ok().json(todo),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        })),
    }
}

pub async fn delete_todo(
    service: web::Data<TodoService>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();

    if service.delete(&id) {
        HttpResponse::Ok().json(serde_json::json!({
            "message": "Todo deleted successfully"
        }))
    } else {
        HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        }))
    }
}

pub async fn toggle_todo(
    service: web::Data<TodoService>,
    path: web::Path<String>,
) -> impl Responder {
    let id = path.into_inner();

    match service.toggle(&id) {
        Some(todo) => HttpResponse::Ok().json(todo),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Todo not found"
        })),
    }
}

pub async fn get_stats(service: web::Data<TodoService>) -> impl Responder {
    let stats = service.get_stats();
    HttpResponse::Ok().json(stats)
}

pub async fn clear_completed(service: web::Data<TodoService>) -> impl Responder {
    service.clear_completed();
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Completed todos cleared"
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn test_root() {
        let resp = root().await;
        let result = test::call_service(
            &test::init_service(App::new().route("/", web::get().to(root))).await,
            test::TestRequest::get().uri("/").to_request(),
        )
        .await;

        assert!(result.status().is_success());
    }

    #[actix_web::test]
    async fn test_health() {
        let result = test::call_service(
            &test::init_service(App::new().route("/health", web::get().to(health))).await,
            test::TestRequest::get().uri("/health").to_request(),
        )
        .await;

        assert!(result.status().is_success());
    }

    #[actix_web::test]
    async fn test_get_todos() {
        let service = web::Data::new(TodoService::new_empty());
        
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos)),
        )
        .await;

        let req = test::TestRequest::get().uri("/api/todos").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_create_todo() {
        let service = web::Data::new(TodoService::new_empty());
        
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        let req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": "Test Todo",
                "priority": "high"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 201);
    }

    #[actix_web::test]
    async fn test_create_todo_empty_text() {
        let service = web::Data::new(TodoService::new_empty());
        
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        let req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": ""
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 400);
    }
}

