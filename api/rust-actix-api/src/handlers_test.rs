#[cfg(test)]
mod handlers_tests {
    use crate::handlers::*;
    use crate::models::{Priority, TodoCreate, TodoUpdate};
    use crate::service::TodoService;
    use actix_web::{test, web, App};

    #[actix_web::test]
    async fn test_root_endpoint() {
        let app = test::init_service(App::new().route("/", web::get().to(root))).await;

        let req = test::TestRequest::get().uri("/").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["message"], "🌶️ Spicy Todo API - Rust/Actix Implementation");
        assert_eq!(body["version"], "1.0.0");
    }

    #[actix_web::test]
    async fn test_health_endpoint() {
        let app = test::init_service(App::new().route("/health", web::get().to(health))).await;

        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
        
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["status"], "healthy");
        assert_eq!(body["service"], "spicy-todo-rust-api");
    }

    #[actix_web::test]
    async fn test_get_todos_empty() {
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
        
        let body: Vec<serde_json::Value> = test::read_body_json(resp).await;
        assert_eq!(body.len(), 0);
    }

    #[actix_web::test]
    async fn test_get_todos_with_data() {
        let service = web::Data::new(TodoService::new());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos)),
        )
        .await;

        let req = test::TestRequest::get().uri("/api/todos").to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
        
        let body: Vec<serde_json::Value> = test::read_body_json(resp).await;
        assert!(!body.is_empty());
    }

    #[actix_web::test]
    async fn test_get_todos_with_filter() {
        let service = web::Data::new(TodoService::new());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/todos?filter=active")
            .to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_get_todos_with_search() {
        let service = web::Data::new(TodoService::new());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/todos?search=Rust")
            .to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_get_todos_with_priority() {
        let service = web::Data::new(TodoService::new());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/todos?priority=high")
            .to_request();
        let resp = test::call_service(&app, req).await;

        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_create_todo_success() {
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
                "priority": "high",
                "completed": false,
                "dueDate": "2024-12-31",
                "reminderTime": "10:00"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 201);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["text"], "Test Todo");
        assert_eq!(body["priority"], "high");
    }

    #[actix_web::test]
    async fn test_create_todo_with_defaults() {
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
                "text": "Test Todo"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 201);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["text"], "Test Todo");
        assert_eq!(body["priority"], "medium"); // default
        assert_eq!(body["completed"], false); // default
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

    #[actix_web::test]
    async fn test_create_todo_whitespace_text() {
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
                "text": "   "
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 400);
    }

    #[actix_web::test]
    async fn test_create_todo_too_long() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        let long_text = "a".repeat(501);
        let req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": long_text
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 400);
    }

    #[actix_web::test]
    async fn test_get_todo_by_id_success() {
        let service = web::Data::new(TodoService::new_empty());
        
        // Create a todo first
        let created = service.create(TodoCreate {
            text: "Test Todo".to_string(),
            priority: Some(Priority::High),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::get().to(get_todo)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri(&format!("/api/todos/{}", created.id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["id"], created.id);
        assert_eq!(body["text"], "Test Todo");
    }

    #[actix_web::test]
    async fn test_get_todo_by_id_not_found() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::get().to(get_todo)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/todos/non-existent-id")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }

    #[actix_web::test]
    async fn test_update_todo_success() {
        let service = web::Data::new(TodoService::new_empty());
        
        // Create a todo first
        let created = service.create(TodoCreate {
            text: "Original".to_string(),
            priority: Some(Priority::Low),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::put().to(update_todo)),
        )
        .await;

        let req = test::TestRequest::put()
            .uri(&format!("/api/todos/{}", created.id))
            .set_json(serde_json::json!({
                "text": "Updated",
                "priority": "high",
                "completed": true
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["text"], "Updated");
        assert_eq!(body["priority"], "high");
        assert_eq!(body["completed"], true);
    }

    #[actix_web::test]
    async fn test_update_todo_partial() {
        let service = web::Data::new(TodoService::new_empty());
        
        let created = service.create(TodoCreate {
            text: "Original".to_string(),
            priority: Some(Priority::Medium),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::put().to(update_todo)),
        )
        .await;

        let req = test::TestRequest::put()
            .uri(&format!("/api/todos/{}", created.id))
            .set_json(serde_json::json!({
                "text": "Only text updated"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["text"], "Only text updated");
        assert_eq!(body["priority"], "medium"); // unchanged
    }

    #[actix_web::test]
    async fn test_update_todo_not_found() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::put().to(update_todo)),
        )
        .await;

        let req = test::TestRequest::put()
            .uri("/api/todos/non-existent-id")
            .set_json(serde_json::json!({
                "text": "Updated"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }

    #[actix_web::test]
    async fn test_delete_todo_success() {
        let service = web::Data::new(TodoService::new_empty());
        
        let created = service.create(TodoCreate {
            text: "To Delete".to_string(),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        });

        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::delete().to(delete_todo)),
        )
        .await;

        let req = test::TestRequest::delete()
            .uri(&format!("/api/todos/{}", created.id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["message"], "Todo deleted successfully");
    }

    #[actix_web::test]
    async fn test_delete_todo_not_found() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::delete().to(delete_todo)),
        )
        .await;

        let req = test::TestRequest::delete()
            .uri("/api/todos/non-existent-id")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }

    #[actix_web::test]
    async fn test_toggle_todo_success() {
        let service = web::Data::new(TodoService::new_empty());
        
        let created = service.create(TodoCreate {
            text: "To Toggle".to_string(),
            priority: None,
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}/toggle", web::patch().to(toggle_todo)),
        )
        .await;

        // First toggle
        let req = test::TestRequest::patch()
            .uri(&format!("/api/todos/{}/toggle", created.id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["completed"], true);

        // Second toggle
        let req = test::TestRequest::patch()
            .uri(&format!("/api/todos/{}/toggle", created.id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["completed"], false);
    }

    #[actix_web::test]
    async fn test_toggle_todo_not_found() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}/toggle", web::patch().to(toggle_todo)),
        )
        .await;

        let req = test::TestRequest::patch()
            .uri("/api/todos/non-existent-id/toggle")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }

    #[actix_web::test]
    async fn test_get_stats() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/stats/summary", web::get().to(get_stats)),
        )
        .await;

        let req = test::TestRequest::get()
            .uri("/api/todos/stats/summary")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert!(body["total"].is_number());
        assert!(body["active"].is_number());
        assert!(body["completed"].is_number());
    }

    #[actix_web::test]
    async fn test_clear_completed() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/completed", web::delete().to(clear_completed)),
        )
        .await;

        let req = test::TestRequest::delete()
            .uri("/api/todos/completed")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: serde_json::Value = test::read_body_json(resp).await;
        assert_eq!(body["message"], "Completed todos cleared");
    }
}

