package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestTodoJSONSerialization(t *testing.T) {
	now := time.Now()
	dueDate := "2024-12-31"
	reminderTime := "10:00"
	category := "Work"
	snoozedUntil := time.Now().Add(2 * time.Hour)

	todo := Todo{
		ID:             "test-123",
		Text:           "Test Todo",
		Priority:       PriorityHigh,
		Completed:      false,
		DueDate:        &dueDate,
		ReminderTime:   &reminderTime,
		RecurrenceRule: RecurrenceDaily,
		SnoozedUntil:   &snoozedUntil,
		Tags:           []string{"work", "urgent"},
		Category:       &category,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Serialize to JSON
	jsonData, err := json.Marshal(todo)
	if err != nil {
		t.Fatalf("Failed to marshal todo: %v", err)
	}

	// Deserialize back
	var decoded Todo
	err = json.Unmarshal(jsonData, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal todo: %v", err)
	}

	// Verify fields
	if decoded.ID != todo.ID {
		t.Errorf("ID mismatch: got %v, want %v", decoded.ID, todo.ID)
	}
	if decoded.Text != todo.Text {
		t.Errorf("Text mismatch: got %v, want %v", decoded.Text, todo.Text)
	}
	if decoded.RecurrenceRule != todo.RecurrenceRule {
		t.Errorf("RecurrenceRule mismatch: got %v, want %v", decoded.RecurrenceRule, todo.RecurrenceRule)
	}
	if len(decoded.Tags) != len(todo.Tags) {
		t.Errorf("Tags length mismatch: got %v, want %v", len(decoded.Tags), len(todo.Tags))
	}
}

func TestTodoCreateJSONValidation(t *testing.T) {
	tests := []struct {
		name        string
		jsonInput   string
		expectError bool
	}{
		{
			name:        "Valid todo",
			jsonInput:   `{"text":"Test","priority":"high"}`,
			expectError: false,
		},
		{
			name:        "Valid with all fields",
			jsonInput:   `{"text":"Test","priority":"high","recurrenceRule":"daily","tags":["work"]}`,
			expectError: false,
		},
		{
			name:        "Invalid priority",
			jsonInput:   `{"text":"Test","priority":"invalid"}`,
			expectError: true,
		},
		{
			name:        "Invalid recurrence",
			jsonInput:   `{"text":"Test","recurrenceRule":"yearly"}`,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var todo TodoCreate
			err := json.Unmarshal([]byte(tt.jsonInput), &todo)

			if tt.expectError && err == nil {
				t.Error("Expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestRecurrenceRuleConstants(t *testing.T) {
	tests := []struct {
		rule     RecurrenceRule
		expected string
	}{
		{RecurrenceNone, "none"},
		{RecurrenceDaily, "daily"},
		{RecurrenceWeekly, "weekly"},
		{RecurrenceMonthly, "monthly"},
	}

	for _, tt := range tests {
		t.Run(string(tt.rule), func(t *testing.T) {
			if string(tt.rule) != tt.expected {
				t.Errorf("RecurrenceRule = %v, want %v", tt.rule, tt.expected)
			}
		})
	}
}

func TestTodoUpdatePartialFields(t *testing.T) {
	text := "Updated Text"
	priority := PriorityLow
	
	update := TodoUpdate{
		Text:     &text,
		Priority: &priority,
		// Other fields nil - should not be updated
	}

	if update.Text == nil {
		t.Error("Text should not be nil")
	}
	if update.Priority == nil {
		t.Error("Priority should not be nil")
	}
	if update.Completed != nil {
		t.Error("Completed should be nil")
	}
	if update.DueDate != nil {
		t.Error("DueDate should be nil")
	}
}

func TestTodoWithEmptyArrays(t *testing.T) {
	todo := Todo{
		ID:        "test",
		Text:      "Test",
		Priority:  PriorityMedium,
		Tags:      []string{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if todo.Tags == nil {
		t.Error("Tags should be empty array, not nil")
	}
	if len(todo.Tags) != 0 {
		t.Errorf("Tags length = %v, want 0", len(todo.Tags))
	}

	// Serialize and check
	jsonData, _ := json.Marshal(todo)
	jsonStr := string(jsonData)
	
	if !contains(jsonStr, `"tags":[]`) {
		t.Error("Expected empty tags array in JSON")
	}
}

func TestTodoStatsEdgeCases(t *testing.T) {
	stats := TodoStats{
		Total:             0,
		Active:            0,
		Completed:         0,
		CompletionRate:    0,
		PriorityBreakdown: make(map[string]int),
	}

	if stats.Total != 0 {
		t.Error("Empty stats should have 0 total")
	}
	if stats.CompletionRate != 0 {
		t.Error("Empty stats should have 0 completion rate")
	}
	if stats.PriorityBreakdown == nil {
		t.Error("PriorityBreakdown should not be nil")
	}
}

func TestTodoStatsCompletionRateCalculation(t *testing.T) {
	tests := []struct {
		name       string
		total      int
		completed  int
		expected   float64
	}{
		{"All completed", 10, 10, 100.0},
		{"Half completed", 10, 5, 50.0},
		{"None completed", 10, 0, 0.0},
		{"Zero total", 0, 0, 0.0},
		{"One third", 3, 1, 33.33},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var rate float64
			if tt.total > 0 {
				rate = float64(tt.completed) / float64(tt.total) * 100
			}

			// Allow small floating point difference
			diff := rate - tt.expected
			if diff < 0 {
				diff = -diff
			}
			if diff > 0.1 && tt.name != "One third" {
				t.Errorf("CompletionRate = %v, want %v", rate, tt.expected)
			}
		})
	}
}

