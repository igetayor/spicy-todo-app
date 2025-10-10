use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Low,
    Medium,
    High,
}

impl Default for Priority {
    fn default() -> Self {
        Priority::Medium
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Todo {
    pub id: String,
    pub text: String,
    pub priority: Priority,
    pub completed: bool,
    #[serde(rename = "dueDate")]
    pub due_date: Option<String>,
    #[serde(rename = "reminderTime")]
    pub reminder_time: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct TodoCreate {
    pub text: String,
    pub priority: Option<Priority>,
    pub completed: Option<bool>,
    #[serde(rename = "dueDate")]
    pub due_date: Option<String>,
    #[serde(rename = "reminderTime")]
    pub reminder_time: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TodoUpdate {
    pub text: Option<String>,
    pub priority: Option<Priority>,
    pub completed: Option<bool>,
    #[serde(rename = "dueDate")]
    pub due_date: Option<String>,
    #[serde(rename = "reminderTime")]
    pub reminder_time: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TodoStats {
    pub total: usize,
    pub active: usize,
    pub completed: usize,
    #[serde(rename = "completionRate")]
    pub completion_rate: f64,
    #[serde(rename = "priorityBreakdown")]
    pub priority_breakdown: std::collections::HashMap<String, usize>,
    #[serde(rename = "overdueCount")]
    pub overdue_count: usize,
    #[serde(rename = "dueTodayCount")]
    pub due_today_count: usize,
    #[serde(rename = "upcomingCount")]
    pub upcoming_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct TodoQuery {
    pub filter: Option<String>,
    pub search: Option<String>,
    pub priority: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_priority_default() {
        let priority = Priority::default();
        assert_eq!(priority, Priority::Medium);
    }

    #[test]
    fn test_priority_serialization() {
        let priority = Priority::High;
        let json = serde_json::to_string(&priority).unwrap();
        assert_eq!(json, "\"high\"");
    }

    #[test]
    fn test_todo_creation() {
        let todo = Todo {
            id: "test-id".to_string(),
            text: "Test Todo".to_string(),
            priority: Priority::High,
            completed: false,
            due_date: Some("2024-12-31".to_string()),
            reminder_time: Some("10:00".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(todo.id, "test-id");
        assert_eq!(todo.text, "Test Todo");
        assert_eq!(todo.priority, Priority::High);
        assert!(!todo.completed);
    }

    #[test]
    fn test_todo_serialization() {
        let todo = Todo {
            id: "test-id".to_string(),
            text: "Test".to_string(),
            priority: Priority::Low,
            completed: false,
            due_date: None,
            reminder_time: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&todo).unwrap();
        assert!(json.contains("\"id\":\"test-id\""));
        assert!(json.contains("\"text\":\"Test\""));
        assert!(json.contains("\"priority\":\"low\""));
    }
}

