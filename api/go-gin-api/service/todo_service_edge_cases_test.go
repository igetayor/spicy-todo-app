package service

import (
	"spicytodo-go-api/models"
	"sync"
	"testing"
	"time"
)

func TestGetAllWithEmptyService(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todos := service.GetAll("", "", "")
	
	if len(todos) != 0 {
		t.Errorf("Expected 0 todos from empty service, got %d", len(todos))
	}
}

func TestGetByIDWithEmptyID(t *testing.T) {
	service := NewTodoService()
	
	_, exists := service.GetByID("")
	
	if exists {
		t.Error("GetByID with empty ID should return false")
	}
}

func TestUpdateWithEmptyUpdates(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	created := service.Create(models.TodoCreate{Text: "Original"})
	
	// Update with no changes
	empty := models.TodoUpdate{}
	updated, exists := service.Update(created.ID, empty)

	if !exists {
		t.Fatal("Update() should find existing todo")
	}

	// Text should remain unchanged
	if updated.Text != "Original" {
		t.Errorf("Text = %v, want Original", updated.Text)
	}
}

func TestDeleteNonExistentTodo(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	deleted := service.Delete("non-existent-id")
	
	if deleted {
		t.Error("Delete() should return false for non-existent todo")
	}
}

func TestTogglePreservesOtherFields(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	originalText := "Test Todo"
	originalPriority := models.PriorityHigh
	
	created := service.Create(models.TodoCreate{
		Text:     originalText,
		Priority: originalPriority,
	})

	toggled, _ := service.Toggle(created.ID)

	// Completed should change
	if !toggled.Completed {
		t.Error("Expected Completed to be true after toggle")
	}

	// Other fields should remain unchanged
	if toggled.Text != originalText {
		t.Error("Toggle should not change Text")
	}
	if toggled.Priority != originalPriority {
		t.Error("Toggle should not change Priority")
	}
}

func TestGetStatsWithAllPriorities(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create todos with all priority levels
	service.Create(models.TodoCreate{Text: "High 1", Priority: models.PriorityHigh})
	service.Create(models.TodoCreate{Text: "High 2", Priority: models.PriorityHigh})
	service.Create(models.TodoCreate{Text: "Medium 1", Priority: models.PriorityMedium})
	service.Create(models.TodoCreate{Text: "Low 1", Priority: models.PriorityLow})

	stats := service.GetStats()

	// Check priority breakdown
	if stats.PriorityBreakdown["high"] != 2 {
		t.Errorf("High priority count = %v, want 2", stats.PriorityBreakdown["high"])
	}
	if stats.PriorityBreakdown["medium"] != 1 {
		t.Errorf("Medium priority count = %v, want 1", stats.PriorityBreakdown["medium"])
	}
	if stats.PriorityBreakdown["low"] != 1 {
		t.Errorf("Low priority count = %v, want 1", stats.PriorityBreakdown["low"])
	}
}

func TestClearCompletedPreservesActive(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	active1 := service.Create(models.TodoCreate{Text: "Active 1", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed 1", Completed: true})
	active2 := service.Create(models.TodoCreate{Text: "Active 2", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed 2", Completed: true})

	service.ClearCompleted()

	// Should have 2 active todos
	if len(service.todos) != 2 {
		t.Errorf("Expected 2 active todos, got %d", len(service.todos))
	}

	// Verify correct todos remain
	_, exists1 := service.GetByID(active1.ID)
	_, exists2 := service.GetByID(active2.ID)

	if !exists1 || !exists2 {
		t.Error("Active todos should still exist after ClearCompleted")
	}
}

func TestConcurrentCreateAndRead(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	var wg sync.WaitGroup
	createdIDs := make(chan string, 100)

	// Concurrent writes
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			todo := service.Create(models.TodoCreate{Text: "Concurrent"})
			createdIDs <- todo.ID
		}(i)
	}

	// Concurrent reads
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			service.GetAll("", "", "")
		}()
	}

	wg.Wait()
	close(createdIDs)

	// Count created todos
	count := 0
	for range createdIDs {
		count++
	}

	if count != 50 {
		t.Errorf("Expected 50 todos created, got %d", count)
	}

	if len(service.todos) != 50 {
		t.Errorf("Expected 50 todos in storage, got %d", len(service.todos))
	}
}

func TestConcurrentUpdateAndDelete(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create initial todos
	ids := make([]string, 20)
	for i := 0; i < 20; i++ {
		todo := service.Create(models.TodoCreate{Text: "Test"})
		ids[i] = todo.ID
	}

	var wg sync.WaitGroup

	// Concurrent updates on first 10
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			text := "Updated"
			service.Update(id, models.TodoUpdate{Text: &text})
		}(ids[i])
	}

	// Concurrent deletes on last 10
	for i := 10; i < 20; i++ {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			service.Delete(id)
		}(ids[i])
	}

	wg.Wait()

	// Should have 10 todos left (updated ones)
	if len(service.todos) != 10 {
		t.Errorf("Expected 10 todos remaining, got %d", len(service.todos))
	}
}

func TestFilterCombinations(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create diverse test data
	service.Create(models.TodoCreate{
		Text:      "High Active Work",
		Priority:  models.PriorityHigh,
		Completed: false,
	})
	service.Create(models.TodoCreate{
		Text:      "High Completed Work",
		Priority:  models.PriorityHigh,
		Completed: true,
	})
	service.Create(models.TodoCreate{
		Text:      "Low Active Home",
		Priority:  models.PriorityLow,
		Completed: false,
	})

	tests := []struct {
		name     string
		filter   string
		search   string
		priority string
		expected int
	}{
		{"All", "", "", "", 3},
		{"Active only", "active", "", "", 2},
		{"Completed only", "completed", "", "", 1},
		{"High priority", "", "", "high", 2},
		{"Search 'Work'", "", "Work", "", 2},
		{"Active + High", "active", "", "high", 1},
		{"Active + Search 'Home'", "active", "Home", "", 1},
		{"High + Search 'Work'", "", "Work", "high", 2},
		{"All filters", "active", "Work", "high", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			todos := service.GetAll(tt.filter, tt.search, tt.priority)
			if len(todos) != tt.expected {
				t.Errorf("Got %d todos, want %d", len(todos), tt.expected)
			}
		})
	}
}

func TestGetStatsDueDateCalculations(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	today := time.Now().Format("2006-01-02")
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
	nextWeek := time.Now().AddDate(0, 0, 5).Format("2006-01-02")
	farFuture := time.Now().AddDate(0, 0, 10).Format("2006-01-02")

	// Overdue
	service.Create(models.TodoCreate{
		Text:      "Overdue",
		DueDate:   &yesterday,
		Completed: false,
	})

	// Due today
	service.Create(models.TodoCreate{
		Text:      "Due Today",
		DueDate:   &today,
		Completed: false,
	})

	// Due soon (within 7 days)
	service.Create(models.TodoCreate{
		Text:      "Due Soon",
		DueDate:   &nextWeek,
		Completed: false,
	})

	// Far future (beyond 7 days)
	service.Create(models.TodoCreate{
		Text:      "Far Future",
		DueDate:   &farFuture,
		Completed: false,
	})

	// Completed (should not count as overdue)
	service.Create(models.TodoCreate{
		Text:      "Completed Overdue",
		DueDate:   &yesterday,
		Completed: true,
	})

	stats := service.GetStats()

	if stats.OverdueCount != 1 {
		t.Errorf("OverdueCount = %v, want 1", stats.OverdueCount)
	}
	if stats.DueTodayCount != 1 {
		t.Errorf("DueTodayCount = %v, want 1", stats.DueTodayCount)
	}
	if stats.UpcomingCount != 1 {
		t.Errorf("UpcomingCount = %v, want 1", stats.UpcomingCount)
	}
}

func TestHelperFunctionEdgeCases(t *testing.T) {
	t.Run("contains with empty strings", func(t *testing.T) {
		if !contains("", "") {
			t.Error("Empty strings should match")
		}
		if !contains("abc", "") {
			t.Error("Any string should contain empty string")
		}
		if contains("", "abc") {
			t.Error("Empty string should not contain non-empty")
		}
	})

	t.Run("contains case insensitive", func(t *testing.T) {
		if !contains("Hello World", "WORLD") {
			t.Error("Should be case insensitive")
		}
		if !contains("HELLO", "hello") {
			t.Error("Should be case insensitive")
		}
	})

	t.Run("isWithinDays edge cases", func(t *testing.T) {
		today := time.Now().Format("2006-01-02")
		
		// Same day should return false (not in future)
		if isWithinDays(today, today, 7) {
			t.Error("Same day should not be within days (needs to be future)")
		}

		// Invalid date format
		if isWithinDays("invalid", today, 7) {
			t.Error("Invalid date should return false")
		}

		// Negative days should work
		yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
		if isWithinDays(yesterday, today, 7) {
			t.Error("Past date should return false")
		}
	})
}

func TestCreateWithAllOptionalFields(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	dueDate := "2024-12-31"
	reminderTime := "10:00"
	category := "Work"

	input := models.TodoCreate{
		Text:           "Full Todo",
		Priority:       models.PriorityHigh,
		Completed:      true,
		DueDate:        &dueDate,
		ReminderTime:   &reminderTime,
		RecurrenceRule: models.RecurrenceWeekly,
		Tags:           []string{"tag1", "tag2", "tag3"},
		Category:       &category,
	}

	todo := service.Create(input)

	if todo.Text != input.Text {
		t.Error("Text mismatch")
	}
	if todo.Priority != input.Priority {
		t.Error("Priority mismatch")
	}
	if todo.Completed != input.Completed {
		t.Error("Completed mismatch")
	}
	if *todo.DueDate != *input.DueDate {
		t.Error("DueDate mismatch")
	}
	if *todo.ReminderTime != *input.ReminderTime {
		t.Error("ReminderTime mismatch")
	}
	if todo.RecurrenceRule != input.RecurrenceRule {
		t.Error("RecurrenceRule mismatch")
	}
	if len(todo.Tags) != len(input.Tags) {
		t.Error("Tags length mismatch")
	}
	if *todo.Category != *input.Category {
		t.Error("Category mismatch")
	}
}

func TestUpdateAllFields(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	created := service.Create(models.TodoCreate{Text: "Original"})

	// Update all fields
	newText := "Updated"
	newPriority := models.PriorityLow
	newCompleted := true
	newDueDate := "2024-12-31"
	newReminderTime := "15:00"
	newRecurrence := models.RecurrenceMonthly
	newCategory := "Personal"

	update := models.TodoUpdate{
		Text:           &newText,
		Priority:       &newPriority,
		Completed:      &newCompleted,
		DueDate:        &newDueDate,
		ReminderTime:   &newReminderTime,
		RecurrenceRule: &newRecurrence,
		Tags:           []string{"updated"},
		Category:       &newCategory,
	}

	updated, _ := service.Update(created.ID, update)

	if updated.Text != newText {
		t.Error("Text not updated")
	}
	if updated.Priority != newPriority {
		t.Error("Priority not updated")
	}
	if updated.Completed != newCompleted {
		t.Error("Completed not updated")
	}
	if *updated.DueDate != newDueDate {
		t.Error("DueDate not updated")
	}
	if *updated.ReminderTime != newReminderTime {
		t.Error("ReminderTime not updated")
	}
	if updated.RecurrenceRule != newRecurrence {
		t.Error("RecurrenceRule not updated")
	}
	if len(updated.Tags) != 1 || updated.Tags[0] != "updated" {
		t.Error("Tags not updated")
	}
	if *updated.Category != newCategory {
		t.Error("Category not updated")
	}
}

func TestClearCompletedWithNoCompleted(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Active 1", Completed: false})
	service.Create(models.TodoCreate{Text: "Active 2", Completed: false})

	initialCount := len(service.todos)
	service.ClearCompleted()

	if len(service.todos) != initialCount {
		t.Errorf("ClearCompleted() should not remove active todos")
	}
}

func TestGetAllWithCaseSensitiveSearch(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Learn GO Programming"})
	service.Create(models.TodoCreate{Text: "Learn Python"})

	// Case-insensitive search
	todos := service.GetAll("", "go", "")
	
	if len(todos) != 1 {
		t.Errorf("Expected 1 todo matching 'go', got %d", len(todos))
	}

	todos = service.GetAll("", "PYTHON", "")
	
	if len(todos) != 1 {
		t.Errorf("Expected 1 todo matching 'PYTHON', got %d", len(todos))
	}
}

func TestMultipleTodoOperationsInSequence(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create
	todo := service.Create(models.TodoCreate{
		Text:     "Multi-op Todo",
		Priority: models.PriorityLow,
	})

	// Update
	newPriority := models.PriorityHigh
	service.Update(todo.ID, models.TodoUpdate{Priority: &newPriority})

	// Toggle
	service.Toggle(todo.ID)

	// Toggle again
	service.Toggle(todo.ID)

	// Update again
	newText := "Changed Text"
	updated, _ := service.Update(todo.ID, models.TodoUpdate{Text: &newText})

	// Verify final state
	if updated.Text != "Changed Text" {
		t.Error("Text not updated correctly")
	}
	if updated.Priority != models.PriorityHigh {
		t.Error("Priority not updated correctly")
	}
	if updated.Completed {
		t.Error("Completed should be false after double toggle")
	}
}

func TestGetStatsWithOnlyCompletedTodos(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Done 1", Completed: true})
	service.Create(models.TodoCreate{Text: "Done 2", Completed: true})

	stats := service.GetStats()

	if stats.Total != 2 {
		t.Errorf("Total = %v, want 2", stats.Total)
	}
	if stats.Active != 0 {
		t.Errorf("Active = %v, want 0", stats.Active)
	}
	if stats.Completed != 2 {
		t.Errorf("Completed = %v, want 2", stats.Completed)
	}
	if stats.CompletionRate != 100.0 {
		t.Errorf("CompletionRate = %v, want 100.0", stats.CompletionRate)
	}
}

func TestToLowerEdgeCases(t *testing.T) {
	tests := []struct {
		input    byte
		expected byte
	}{
		{'A', 'a'},
		{'M', 'm'},
		{'Z', 'z'},
		{'a', 'a'},
		{'m', 'm'},
		{'z', 'z'},
		{'0', '0'},
		{'9', '9'},
		{' ', ' '},
		{'!', '!'},
		{'@', '@'},
	}

	for _, tt := range tests {
		result := toLower(tt.input)
		if result != tt.expected {
			t.Errorf("toLower(%c) = %c, want %c", tt.input, result, tt.expected)
		}
	}
}

func TestContainsWithSpecialCharacters(t *testing.T) {
	tests := []struct {
		text     string
		substr   string
		expected bool
	}{
		{"Hello, World!", "World", true},
		{"Test@Example.com", "@Example", true},
		{"Price: $99.99", "$99", true},
		{"Special #chars!", "#chars", true},
		{"Unicode: 你好", "你好", true},
	}

	for _, tt := range tests {
		result := contains(tt.text, tt.substr)
		if result != tt.expected {
			t.Errorf("contains(%q, %q) = %v, want %v", tt.text, tt.substr, result, tt.expected)
		}
	}
}

func TestIsWithinDaysVariousDurations(t *testing.T) {
	today := time.Now().Format("2006-01-02")
	
	tests := []struct {
		name     string
		dateStr  string
		days     int
		expected bool
	}{
		{"1 day in future, within 7", time.Now().AddDate(0, 0, 1).Format("2006-01-02"), 7, true},
		{"7 days in future, within 7", time.Now().AddDate(0, 0, 7).Format("2006-01-02"), 7, true},
		{"8 days in future, not within 7", time.Now().AddDate(0, 0, 8).Format("2006-01-02"), 7, false},
		{"Past date, not within", time.Now().AddDate(0, 0, -1).Format("2006-01-02"), 7, false},
		{"Today, not within (needs future)", today, 7, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isWithinDays(tt.dateStr, today, tt.days)
			if result != tt.expected {
				t.Errorf("isWithinDays(%s, %s, %d) = %v, want %v", 
					tt.dateStr, today, tt.days, result, tt.expected)
			}
		})
	}
}

