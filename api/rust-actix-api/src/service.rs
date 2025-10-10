use crate::models::{Priority, Todo, TodoCreate, TodoStats, TodoUpdate};
use chrono::{NaiveDate, Utc};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

pub struct TodoService {
    todos: Mutex<HashMap<String, Todo>>,
}

impl TodoService {
    pub fn new() -> Self {
        let service = TodoService {
            todos: Mutex::new(HashMap::new()),
        };
        service.load_sample_data();
        service
    }

    pub fn new_empty() -> Self {
        TodoService {
            todos: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_all(&self, filter: Option<String>, search: Option<String>, priority: Option<String>) -> Vec<Todo> {
        let todos = self.todos.lock().unwrap();
        let mut filtered: Vec<Todo> = todos.values().cloned().collect();

        // Apply filters
        if let Some(f) = filter {
            filtered = match f.as_str() {
                "active" => filtered.into_iter().filter(|t| !t.completed).collect(),
                "completed" => filtered.into_iter().filter(|t| t.completed).collect(),
                _ => filtered,
            };
        }

        if let Some(s) = search {
            let search_lower = s.to_lowercase();
            filtered = filtered
                .into_iter()
                .filter(|t| t.text.to_lowercase().contains(&search_lower))
                .collect();
        }

        if let Some(p) = priority {
            let priority_lower = p.to_lowercase();
            filtered = filtered
                .into_iter()
                .filter(|t| match &t.priority {
                    Priority::Low => priority_lower == "low",
                    Priority::Medium => priority_lower == "medium",
                    Priority::High => priority_lower == "high",
                })
                .collect();
        }

        filtered
    }

    pub fn get_by_id(&self, id: &str) -> Option<Todo> {
        let todos = self.todos.lock().unwrap();
        todos.get(id).cloned()
    }

    pub fn create(&self, input: TodoCreate) -> Todo {
        let now = Utc::now();
        let todo = Todo {
            id: Uuid::new_v4().to_string(),
            text: input.text,
            priority: input.priority.unwrap_or_default(),
            completed: input.completed.unwrap_or(false),
            due_date: input.due_date,
            reminder_time: input.reminder_time,
            created_at: now,
            updated_at: now,
        };

        let id = todo.id.clone();
        self.todos.lock().unwrap().insert(id, todo.clone());
        todo
    }

    pub fn update(&self, id: &str, input: TodoUpdate) -> Option<Todo> {
        let mut todos = self.todos.lock().unwrap();
        
        if let Some(todo) = todos.get_mut(id) {
            if let Some(text) = input.text {
                todo.text = text;
            }
            if let Some(priority) = input.priority {
                todo.priority = priority;
            }
            if let Some(completed) = input.completed {
                todo.completed = completed;
            }
            if let Some(due_date) = input.due_date {
                todo.due_date = Some(due_date);
            }
            if let Some(reminder_time) = input.reminder_time {
                todo.reminder_time = Some(reminder_time);
            }
            todo.updated_at = Utc::now();
            Some(todo.clone())
        } else {
            None
        }
    }

    pub fn delete(&self, id: &str) -> bool {
        self.todos.lock().unwrap().remove(id).is_some()
    }

    pub fn toggle(&self, id: &str) -> Option<Todo> {
        let mut todos = self.todos.lock().unwrap();
        
        if let Some(todo) = todos.get_mut(id) {
            todo.completed = !todo.completed;
            todo.updated_at = Utc::now();
            Some(todo.clone())
        } else {
            None
        }
    }

    pub fn get_stats(&self) -> TodoStats {
        let todos = self.todos.lock().unwrap();
        let all_todos: Vec<&Todo> = todos.values().collect();

        let total = all_todos.len();
        let completed = all_todos.iter().filter(|t| t.completed).count();
        let active = total - completed;

        let mut priority_breakdown = HashMap::new();
        priority_breakdown.insert(
            "low".to_string(),
            all_todos.iter().filter(|t| matches!(t.priority, Priority::Low)).count(),
        );
        priority_breakdown.insert(
            "medium".to_string(),
            all_todos.iter().filter(|t| matches!(t.priority, Priority::Medium)).count(),
        );
        priority_breakdown.insert(
            "high".to_string(),
            all_todos.iter().filter(|t| matches!(t.priority, Priority::High)).count(),
        );

        let today = Utc::now().date_naive();
        let mut overdue_count = 0;
        let mut due_today_count = 0;
        let mut upcoming_count = 0;

        for todo in all_todos.iter() {
            if !todo.completed {
                if let Some(due_date_str) = &todo.due_date {
                    if let Ok(due_date) = NaiveDate::parse_from_str(due_date_str, "%Y-%m-%d") {
                        if due_date < today {
                            overdue_count += 1;
                        } else if due_date == today {
                            due_today_count += 1;
                        } else if due_date <= today + chrono::Duration::days(7) {
                            upcoming_count += 1;
                        }
                    }
                }
            }
        }

        let completion_rate = if total > 0 {
            (completed as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        TodoStats {
            total,
            active,
            completed,
            completion_rate,
            priority_breakdown,
            overdue_count,
            due_today_count,
            upcoming_count,
        }
    }

    pub fn clear_completed(&self) {
        let mut todos = self.todos.lock().unwrap();
        todos.retain(|_, todo| !todo.completed);
    }

    fn load_sample_data(&self) {
        let now = Utc::now();
        let today = Utc::now().date_naive();
        let tomorrow = today + chrono::Duration::days(1);
        let next_week = today + chrono::Duration::days(7);
        let yesterday = today - chrono::Duration::days(1);

        let samples = vec![
            Todo {
                id: Uuid::new_v4().to_string(),
                text: "Learn Rust programming language".to_string(),
                priority: Priority::High,
                completed: false,
                due_date: Some(tomorrow.to_string()),
                reminder_time: Some("09:00".to_string()),
                created_at: now,
                updated_at: now,
            },
            Todo {
                id: Uuid::new_v4().to_string(),
                text: "Build blazingly fast API with Actix-web".to_string(),
                priority: Priority::High,
                completed: true,
                due_date: Some(yesterday.to_string()),
                reminder_time: Some("14:30".to_string()),
                created_at: now,
                updated_at: now,
            },
            Todo {
                id: Uuid::new_v4().to_string(),
                text: "Master async/await in Rust".to_string(),
                priority: Priority::Medium,
                completed: false,
                due_date: Some(next_week.to_string()),
                reminder_time: Some("16:00".to_string()),
                created_at: now,
                updated_at: now,
            },
        ];

        let mut todos = self.todos.lock().unwrap();
        for todo in samples {
            todos.insert(todo.id.clone(), todo);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_service() {
        let service = TodoService::new();
        let todos = service.get_all(None, None, None);
        assert!(!todos.is_empty(), "Service should have sample data");
    }

    #[test]
    fn test_create_todo() {
        let service = TodoService::new_empty();
        
        let input = TodoCreate {
            text: "Test Todo".to_string(),
            priority: Some(Priority::High),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        };

        let todo = service.create(input);
        
        assert_eq!(todo.text, "Test Todo");
        assert_eq!(todo.priority, Priority::High);
        assert!(!todo.completed);
        assert!(!todo.id.is_empty());
    }

    #[test]
    fn test_create_todo_with_defaults() {
        let service = TodoService::new_empty();
        
        let input = TodoCreate {
            text: "Test".to_string(),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        };

        let todo = service.create(input);
        
        assert_eq!(todo.priority, Priority::Medium);
        assert!(!todo.completed);
    }

    #[test]
    fn test_get_by_id() {
        let service = TodoService::new_empty();
        let created = service.create(TodoCreate {
            text: "Test".to_string(),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        });

        let found = service.get_by_id(&created.id);
        assert!(found.is_some());
        assert_eq!(found.unwrap().id, created.id);

        let not_found = service.get_by_id("non-existent");
        assert!(not_found.is_none());
    }

    #[test]
    fn test_get_all_with_filters() {
        let service = TodoService::new_empty();
        
        service.create(TodoCreate {
            text: "Active Todo".to_string(),
            priority: Some(Priority::High),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        service.create(TodoCreate {
            text: "Completed Todo".to_string(),
            priority: Some(Priority::Low),
            completed: Some(true),
            due_date: None,
            reminder_time: None,
        });

        // Test filter
        let active = service.get_all(Some("active".to_string()), None, None);
        assert_eq!(active.len(), 1);

        let completed = service.get_all(Some("completed".to_string()), None, None);
        assert_eq!(completed.len(), 1);

        // Test priority filter
        let high = service.get_all(None, None, Some("high".to_string()));
        assert_eq!(high.len(), 1);

        // Test search
        let search = service.get_all(None, Some("Active".to_string()), None);
        assert_eq!(search.len(), 1);
    }

    #[test]
    fn test_update_todo() {
        let service = TodoService::new_empty();
        let created = service.create(TodoCreate {
            text: "Original".to_string(),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        });

        let update = TodoUpdate {
            text: Some("Updated".to_string()),
            priority: Some(Priority::High),
            completed: Some(true),
            due_date: None,
            reminder_time: None,
        };

        let updated = service.update(&created.id, update);
        assert!(updated.is_some());
        
        let todo = updated.unwrap();
        assert_eq!(todo.text, "Updated");
        assert_eq!(todo.priority, Priority::High);
        assert!(todo.completed);
    }

    #[test]
    fn test_update_nonexistent() {
        let service = TodoService::new_empty();
        
        let update = TodoUpdate {
            text: Some("Updated".to_string()),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        };

        let result = service.update("non-existent", update);
        assert!(result.is_none());
    }

    #[test]
    fn test_delete_todo() {
        let service = TodoService::new_empty();
        let created = service.create(TodoCreate {
            text: "To Delete".to_string(),
            priority: None,
            completed: None,
            due_date: None,
            reminder_time: None,
        });

        let deleted = service.delete(&created.id);
        assert!(deleted);

        let found = service.get_by_id(&created.id);
        assert!(found.is_none());
    }

    #[test]
    fn test_delete_nonexistent() {
        let service = TodoService::new_empty();
        let deleted = service.delete("non-existent");
        assert!(!deleted);
    }

    #[test]
    fn test_toggle_todo() {
        let service = TodoService::new_empty();
        let created = service.create(TodoCreate {
            text: "To Toggle".to_string(),
            priority: None,
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let toggled = service.toggle(&created.id);
        assert!(toggled.is_some());
        assert!(toggled.unwrap().completed);

        let toggled_again = service.toggle(&created.id);
        assert!(!toggled_again.unwrap().completed);
    }

    #[test]
    fn test_get_stats() {
        let service = TodoService::new_empty();
        
        service.create(TodoCreate {
            text: "Todo 1".to_string(),
            priority: Some(Priority::High),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        service.create(TodoCreate {
            text: "Todo 2".to_string(),
            priority: Some(Priority::High),
            completed: Some(true),
            due_date: None,
            reminder_time: None,
        });

        service.create(TodoCreate {
            text: "Todo 3".to_string(),
            priority: Some(Priority::Low),
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        let stats = service.get_stats();
        
        assert_eq!(stats.total, 3);
        assert_eq!(stats.active, 2);
        assert_eq!(stats.completed, 1);
        assert!((stats.completion_rate - 33.33).abs() < 0.1);
        assert_eq!(*stats.priority_breakdown.get("high").unwrap(), 2);
        assert_eq!(*stats.priority_breakdown.get("low").unwrap(), 1);
    }

    #[test]
    fn test_clear_completed() {
        let service = TodoService::new_empty();
        
        service.create(TodoCreate {
            text: "Active".to_string(),
            priority: None,
            completed: Some(false),
            due_date: None,
            reminder_time: None,
        });

        service.create(TodoCreate {
            text: "Completed".to_string(),
            priority: None,
            completed: Some(true),
            due_date: None,
            reminder_time: None,
        });

        service.clear_completed();
        
        let todos = service.get_all(None, None, None);
        assert_eq!(todos.len(), 1);
        assert!(!todos[0].completed);
    }
}

