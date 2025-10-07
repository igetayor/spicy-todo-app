package models

import (
	"testing"
	"time"
)

func TestPriorityConstants(t *testing.T) {
	tests := []struct {
		name     string
		priority Priority
		expected string
	}{
		{"Low priority", PriorityLow, "low"},
		{"Medium priority", PriorityMedium, "medium"},
		{"High priority", PriorityHigh, "high"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.priority) != tt.expected {
				t.Errorf("Priority = %v, want %v", tt.priority, tt.expected)
			}
		})
	}
}

func TestTodoStructure(t *testing.T) {
	now := time.Now()
	dueDate := "2024-12-31"
	reminderTime := "10:00"

	todo := Todo{
		ID:           "test-id",
		Text:         "Test Todo",
		Priority:     PriorityHigh,
		Completed:    false,
		DueDate:      &dueDate,
		ReminderTime: &reminderTime,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Test all fields
	if todo.ID != "test-id" {
		t.Errorf("ID = %v, want test-id", todo.ID)
	}
	if todo.Text != "Test Todo" {
		t.Errorf("Text = %v, want Test Todo", todo.Text)
	}
	if todo.Priority != PriorityHigh {
		t.Errorf("Priority = %v, want %v", todo.Priority, PriorityHigh)
	}
	if todo.Completed != false {
		t.Errorf("Completed = %v, want false", todo.Completed)
	}
	if *todo.DueDate != dueDate {
		t.Errorf("DueDate = %v, want %v", *todo.DueDate, dueDate)
	}
	if *todo.ReminderTime != reminderTime {
		t.Errorf("ReminderTime = %v, want %v", *todo.ReminderTime, reminderTime)
	}
}

func TestTodoCreateStructure(t *testing.T) {
	dueDate := "2024-12-31"
	
	create := TodoCreate{
		Text:         "New Todo",
		Priority:     PriorityMedium,
		Completed:    false,
		DueDate:      &dueDate,
		ReminderTime: nil,
	}

	if create.Text != "New Todo" {
		t.Errorf("Text = %v, want New Todo", create.Text)
	}
	if create.Priority != PriorityMedium {
		t.Errorf("Priority = %v, want %v", create.Priority, PriorityMedium)
	}
	if create.DueDate == nil || *create.DueDate != dueDate {
		t.Errorf("DueDate = %v, want %v", create.DueDate, dueDate)
	}
}

func TestTodoUpdateStructure(t *testing.T) {
	text := "Updated Text"
	priority := PriorityLow
	completed := true

	update := TodoUpdate{
		Text:      &text,
		Priority:  &priority,
		Completed: &completed,
	}

	if update.Text == nil || *update.Text != text {
		t.Errorf("Text = %v, want %v", update.Text, text)
	}
	if update.Priority == nil || *update.Priority != priority {
		t.Errorf("Priority = %v, want %v", update.Priority, priority)
	}
	if update.Completed == nil || *update.Completed != completed {
		t.Errorf("Completed = %v, want %v", update.Completed, completed)
	}
}

func TestTodoStatsStructure(t *testing.T) {
	stats := TodoStats{
		Total:          10,
		Active:         6,
		Completed:      4,
		CompletionRate: 40.0,
		PriorityBreakdown: map[string]int{
			"high":   3,
			"medium": 5,
			"low":    2,
		},
		OverdueCount:  1,
		DueTodayCount: 2,
		UpcomingCount: 3,
	}

	if stats.Total != 10 {
		t.Errorf("Total = %v, want 10", stats.Total)
	}
	if stats.Active != 6 {
		t.Errorf("Active = %v, want 6", stats.Active)
	}
	if stats.Completed != 4 {
		t.Errorf("Completed = %v, want 4", stats.Completed)
	}
	if stats.CompletionRate != 40.0 {
		t.Errorf("CompletionRate = %v, want 40.0", stats.CompletionRate)
	}
	if len(stats.PriorityBreakdown) != 3 {
		t.Errorf("PriorityBreakdown length = %v, want 3", len(stats.PriorityBreakdown))
	}
}

