#[cfg(test)]
mod integration_tests {
    use crate::handlers::*;
    use crate::models::{Priority, TodoCreate};
    use crate::service::TodoService;
    use actix_web::{test, web, App};

    #[actix_web::test]
    async fn test_full_crud_lifecycle() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos))
                .route("/api/todos", web::post().to(create_todo))
                .route("/api/todos/{id}", web::get().to(get_todo))
                .route("/api/todos/{id}", web::put().to(update_todo))
                .route("/api/todos/{id}", web::delete().to(delete_todo))
                .route("/api/todos/{id}/toggle", web::patch().to(toggle_todo)),
        )
        .await;

        // 1. Create a todo
        let create_req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": "Integration Test Todo",
                "priority": "high",
                "completed": false,
                "dueDate": "2024-12-31",
                "reminderTime": "10:00"
            }))
            .to_request();

        let create_resp = test::call_service(&app, create_req).await;
        assert_eq!(create_resp.status(), 201);

        let created: serde_json::Value = test::read_body_json(create_resp).await;
        let todo_id = created["id"].as_str().unwrap();

        // 2. Get the todo by ID
        let get_req = test::TestRequest::get()
            .uri(&format!("/api/todos/{}", todo_id))
            .to_request();

        let get_resp = test::call_service(&app, get_req).await;
        assert_eq!(get_resp.status(), 200);

        let get_body: serde_json::Value = test::read_body_json(get_resp).await;
        assert_eq!(get_body["text"], "Integration Test Todo");
        assert_eq!(get_body["priority"], "high");

        // 3. Update the todo
        let update_req = test::TestRequest::put()
            .uri(&format!("/api/todos/{}", todo_id))
            .set_json(serde_json::json!({
                "text": "Updated Integration Test Todo",
                "priority": "medium",
                "completed": true
            }))
            .to_request();

        let update_resp = test::call_service(&app, update_req).await;
        assert_eq!(update_resp.status(), 200);

        let update_body: serde_json::Value = test::read_body_json(update_resp).await;
        assert_eq!(update_body["text"], "Updated Integration Test Todo");
        assert_eq!(update_body["priority"], "medium");
        assert_eq!(update_body["completed"], true);

        // 4. Toggle the todo
        let toggle_req = test::TestRequest::patch()
            .uri(&format!("/api/todos/{}/toggle", todo_id))
            .to_request();

        let toggle_resp = test::call_service(&app, toggle_req).await;
        assert_eq!(toggle_resp.status(), 200);

        let toggle_body: serde_json::Value = test::read_body_json(toggle_resp).await;
        assert_eq!(toggle_body["completed"], false);

        // 5. Get all todos
        let get_all_req = test::TestRequest::get()
            .uri("/api/todos")
            .to_request();

        let get_all_resp = test::call_service(&app, get_all_req).await;
        assert_eq!(get_all_resp.status(), 200);

        // 6. Delete the todo
        let delete_req = test::TestRequest::delete()
            .uri(&format!("/api/todos/{}", todo_id))
            .to_request();

        let delete_resp = test::call_service(&app, delete_req).await;
        assert_eq!(delete_resp.status(), 200);

        // 7. Verify deletion
        let verify_req = test::TestRequest::get()
            .uri(&format!("/api/todos/{}", todo_id))
            .to_request();

        let verify_resp = test::call_service(&app, verify_req).await;
        assert_eq!(verify_resp.status(), 404);
    }

    #[actix_web::test]
    async fn test_create_and_filter_todos() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos))
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        // Create multiple todos
        for i in 0..3 {
            let req = test::TestRequest::post()
                .uri("/api/todos")
                .set_json(serde_json::json!({
                    "text": format!("Test Todo {}", i),
                    "priority": if i % 2 == 0 { "high" } else { "low" },
                    "completed": i % 2 == 0
                }))
                .to_request();

            let resp = test::call_service(&app, req).await;
            assert_eq!(resp.status(), 201);
        }

        // Test filtering by active
        let req = test::TestRequest::get()
            .uri("/api/todos?filter=active")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        // Test filtering by completed
        let req = test::TestRequest::get()
            .uri("/api/todos?filter=completed")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        // Test filtering by priority
        let req = test::TestRequest::get()
            .uri("/api/todos?priority=high")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        // Test search
        let req = test::TestRequest::get()
            .uri("/api/todos?search=Test")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);
    }

    #[actix_web::test]
    async fn test_clear_completed_functionality() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::get().to(get_todos))
                .route("/api/todos", web::post().to(create_todo))
                .route("/api/todos/completed", web::delete().to(clear_completed)),
        )
        .await;

        // Create completed todos
        for i in 0..2 {
            let req = test::TestRequest::post()
                .uri("/api/todos")
                .set_json(serde_json::json!({
                    "text": format!("Completed Todo {}", i),
                    "completed": true
                }))
                .to_request();

            let resp = test::call_service(&app, req).await;
            assert_eq!(resp.status(), 201);
        }

        // Create active todo
        let req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": "Active Todo",
                "completed": false
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 201);

        // Clear completed
        let req = test::TestRequest::delete()
            .uri("/api/todos/completed")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        // Verify only active todos remain
        let req = test::TestRequest::get()
            .uri("/api/todos?filter=active")
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 200);

        let body: Vec<serde_json::Value> = test::read_body_json(resp).await;
        assert_eq!(body.len(), 1);
        assert_eq!(body[0]["text"], "Active Todo");
    }

    #[actix_web::test]
    async fn test_stats_with_due_dates() {
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
        assert!(body["completionRate"].is_number());
        assert!(body["priorityBreakdown"].is_object());
    }

    #[actix_web::test]
    async fn test_multiple_concurrent_requests() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        // Create multiple todos concurrently
        let mut handles = vec![];

        for i in 0..5 {
            let app = app.clone();
            let handle = tokio::spawn(async move {
                let req = test::TestRequest::post()
                    .uri("/api/todos")
                    .set_json(serde_json::json!({
                        "text": format!("Concurrent Todo {}", i),
                        "priority": "medium"
                    }))
                    .to_request();

                let resp = test::call_service(&app, req).await;
                resp.status().is_success()
            });
            handles.push(handle);
        }

        // Wait for all requests to complete
        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result);
        }
    }

    #[actix_web::test]
    async fn test_validation_errors() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos", web::post().to(create_todo)),
        )
        .await;

        // Test empty text
        let req = test::TestRequest::post()
            .uri("/api/todos")
            .set_json(serde_json::json!({
                "text": ""
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 400);

        // Test text too long
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
    async fn test_not_found_scenarios() {
        let service = web::Data::new(TodoService::new_empty());
        let app = test::init_service(
            App::new()
                .app_data(service.clone())
                .route("/api/todos/{id}", web::get().to(get_todo))
                .route("/api/todos/{id}", web::put().to(update_todo))
                .route("/api/todos/{id}", web::delete().to(delete_todo))
                .route("/api/todos/{id}/toggle", web::patch().to(toggle_todo)),
        )
        .await;

        let non_existent_id = "non-existent-id";

        // Get non-existent todo
        let req = test::TestRequest::get()
            .uri(&format!("/api/todos/{}", non_existent_id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);

        // Update non-existent todo
        let req = test::TestRequest::put()
            .uri(&format!("/api/todos/{}", non_existent_id))
            .set_json(serde_json::json!({
                "text": "Updated"
            }))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);

        // Delete non-existent todo
        let req = test::TestRequest::delete()
            .uri(&format!("/api/todos/{}", non_existent_id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);

        // Toggle non-existent todo
        let req = test::TestRequest::patch()
            .uri(&format!("/api/todos/{}/toggle", non_existent_id))
            .to_request();

        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), 404);
    }
}

