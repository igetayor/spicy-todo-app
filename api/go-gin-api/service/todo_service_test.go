package service

import (
	"spicytodo-go-api/models"
	"testing"
)

func TestNewTodoService(t *testing.T) {
	service := NewTodoService()

	if service == nil {
		t.Fatal("NewTodoService() returned nil")
	}

	if service.todos == nil {
		t.Error("todos map is nil")
	}

	// Should have sample data loaded
	if len(service.todos) == 0 {
		t.Error("Expected sample todos to be loaded, got 0")
	}
}

func TestCreateTodo(t *testing.T) {
	service := NewTodoService()
	
	// Clear sample data
	service.todos = make(map[string]*models.Todo)

	input := models.TodoCreate{
		Text:      "Test Todo",
		Priority:  models.PriorityHigh,
		Completed: false,
	}

	todo := service.Create(input)

	if todo == nil {
		t.Fatal("Create() returned nil")
	}

	if todo.ID == "" {
		t.Error("Expected ID to be generated")
	}

	if todo.Text != input.Text {
		t.Errorf("Text = %v, want %v", todo.Text, input.Text)
	}

	if todo.Priority != input.Priority {
		t.Errorf("Priority = %v, want %v", todo.Priority, input.Priority)
	}

	if todo.Completed != input.Completed {
		t.Errorf("Completed = %v, want %v", todo.Completed, input.Completed)
	}

	// Check if added to storage
	if len(service.todos) != 1 {
		t.Errorf("Expected 1 todo in storage, got %d", len(service.todos))
	}
}

func TestCreateTodoDefaultPriority(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	input := models.TodoCreate{
		Text: "Test Todo",
		// Priority not set
	}

	todo := service.Create(input)

	if todo.Priority != models.PriorityMedium {
		t.Errorf("Priority = %v, want %v (default)", todo.Priority, models.PriorityMedium)
	}
}

func TestGetByID(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create a todo
	input := models.TodoCreate{Text: "Test Todo"}
	created := service.Create(input)

	// Get by ID
	todo, exists := service.GetByID(created.ID)

	if !exists {
		t.Error("Expected todo to exist")
	}

	if todo.ID != created.ID {
		t.Errorf("ID = %v, want %v", todo.ID, created.ID)
	}

	// Try non-existent ID
	_, exists = service.GetByID("non-existent")
	if exists {
		t.Error("Expected todo not to exist")
	}
}

func TestGetAll(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create test todos
	service.Create(models.TodoCreate{Text: "Todo 1", Priority: models.PriorityHigh, Completed: false})
	service.Create(models.TodoCreate{Text: "Todo 2", Priority: models.PriorityMedium, Completed: true})
	service.Create(models.TodoCreate{Text: "Todo 3", Priority: models.PriorityLow, Completed: false})

	tests := []struct {
		name     string
		filter   string
		search   string
		priority string
		expected int
	}{
		{"All todos", "", "", "", 3},
		{"Active only", "active", "", "", 2},
		{"Completed only", "completed", "", "", 1},
		{"Search 'Todo 1'", "", "Todo 1", "", 1},
		{"High priority", "", "", "high", 1},
		{"Medium priority", "", "", "medium", 1},
		{"Low priority", "", "", "low", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			todos := service.GetAll(tt.filter, tt.search, tt.priority)
			if len(todos) != tt.expected {
				t.Errorf("GetAll() returned %d todos, want %d", len(todos), tt.expected)
			}
		})
	}
}

func TestUpdate(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create a todo
	created := service.Create(models.TodoCreate{Text: "Original"})

	// Update it
	newText := "Updated"
	newPriority := models.PriorityLow
	update := models.TodoUpdate{
		Text:     &newText,
		Priority: &newPriority,
	}

	updated, exists := service.Update(created.ID, update)

	if !exists {
		t.Fatal("Update() returned false for existing todo")
	}

	if updated.Text != newText {
		t.Errorf("Text = %v, want %v", updated.Text, newText)
	}

	if updated.Priority != newPriority {
		t.Errorf("Priority = %v, want %v", updated.Priority, newPriority)
	}

	// Try updating non-existent todo
	_, exists = service.Update("non-existent", update)
	if exists {
		t.Error("Expected Update() to return false for non-existent todo")
	}
}

func TestDelete(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create a todo
	created := service.Create(models.TodoCreate{Text: "To Delete"})

	// Delete it
	deleted := service.Delete(created.ID)
	if !deleted {
		t.Error("Delete() returned false for existing todo")
	}

	// Verify it's gone
	_, exists := service.GetByID(created.ID)
	if exists {
		t.Error("Todo still exists after deletion")
	}

	// Try deleting non-existent todo
	deleted = service.Delete("non-existent")
	if deleted {
		t.Error("Delete() returned true for non-existent todo")
	}
}

func TestToggle(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create a todo
	created := service.Create(models.TodoCreate{Text: "To Toggle", Completed: false})

	// Toggle it
	toggled, exists := service.Toggle(created.ID)
	if !exists {
		t.Fatal("Toggle() returned false for existing todo")
	}

	if !toggled.Completed {
		t.Error("Expected Completed to be true after toggle")
	}

	// Toggle again
	toggled, _ = service.Toggle(created.ID)
	if toggled.Completed {
		t.Error("Expected Completed to be false after second toggle")
	}

	// Try toggling non-existent todo
	_, exists = service.Toggle("non-existent")
	if exists {
		t.Error("Toggle() returned true for non-existent todo")
	}
}

func TestGetStats(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create test todos
	service.Create(models.TodoCreate{Text: "Todo 1", Priority: models.PriorityHigh, Completed: false})
	service.Create(models.TodoCreate{Text: "Todo 2", Priority: models.PriorityHigh, Completed: true})
	service.Create(models.TodoCreate{Text: "Todo 3", Priority: models.PriorityMedium, Completed: false})
	service.Create(models.TodoCreate{Text: "Todo 4", Priority: models.PriorityLow, Completed: true})

	stats := service.GetStats()

	if stats.Total != 4 {
		t.Errorf("Total = %v, want 4", stats.Total)
	}

	if stats.Active != 2 {
		t.Errorf("Active = %v, want 2", stats.Active)
	}

	if stats.Completed != 2 {
		t.Errorf("Completed = %v, want 2", stats.Completed)
	}

	if stats.CompletionRate != 50.0 {
		t.Errorf("CompletionRate = %v, want 50.0", stats.CompletionRate)
	}

	if stats.PriorityBreakdown["high"] != 2 {
		t.Errorf("PriorityBreakdown[high] = %v, want 2", stats.PriorityBreakdown["high"])
	}

	if stats.PriorityBreakdown["medium"] != 1 {
		t.Errorf("PriorityBreakdown[medium] = %v, want 1", stats.PriorityBreakdown["medium"])
	}

	if stats.PriorityBreakdown["low"] != 1 {
		t.Errorf("PriorityBreakdown[low] = %v, want 1", stats.PriorityBreakdown["low"])
	}
}

func TestGetStatsEmpty(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	stats := service.GetStats()

	if stats.Total != 0 {
		t.Errorf("Total = %v, want 0", stats.Total)
	}

	if stats.CompletionRate != 0 {
		t.Errorf("CompletionRate = %v, want 0", stats.CompletionRate)
	}
}

func TestClearCompleted(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create test todos
	service.Create(models.TodoCreate{Text: "Active 1", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed 1", Completed: true})
	service.Create(models.TodoCreate{Text: "Active 2", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed 2", Completed: true})

	// Clear completed
	service.ClearCompleted()

	// Should have 2 active todos left
	if len(service.todos) != 2 {
		t.Errorf("Expected 2 todos remaining, got %d", len(service.todos))
	}

	// Verify only active todos remain
	for _, todo := range service.todos {
		if todo.Completed {
			t.Error("Found completed todo after ClearCompleted()")
		}
	}
}

func TestConcurrentAccess(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Test concurrent writes
	done := make(chan bool)
	
	for i := 0; i < 10; i++ {
		go func(index int) {
			service.Create(models.TodoCreate{Text: "Concurrent Todo"})
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	// Should have 10 todos
	if len(service.todos) != 10 {
		t.Errorf("Expected 10 todos after concurrent writes, got %d", len(service.todos))
	}
}

func TestHelperFunctions(t *testing.T) {
	t.Run("contains", func(t *testing.T) {
		tests := []struct {
			text     string
			substr   string
			expected bool
		}{
			{"Hello World", "World", true},
			{"Hello World", "world", true}, // Case insensitive
			{"Hello World", "xyz", false},
			{"", "", true},
			{"abc", "", true},
		}

		for _, tt := range tests {
			result := contains(tt.text, tt.substr)
			if result != tt.expected {
				t.Errorf("contains(%q, %q) = %v, want %v", tt.text, tt.substr, result, tt.expected)
			}
		}
	})

	t.Run("toLower", func(t *testing.T) {
		tests := []struct {
			input    byte
			expected byte
		}{
			{'A', 'a'},
			{'Z', 'z'},
			{'a', 'a'},
			{'z', 'z'},
			{'0', '0'},
		}

		for _, tt := range tests {
			result := toLower(tt.input)
			if result != tt.expected {
				t.Errorf("toLower(%c) = %c, want %c", tt.input, result, tt.expected)
			}
		}
	})
}

