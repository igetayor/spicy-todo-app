package service

import (
	"spicytodo-go-api/models"
	"testing"
	"time"
)

func TestSnooze(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	created := service.Create(models.TodoCreate{Text: "Test Todo"})
	
	until := time.Now().Add(2 * time.Hour)
	snoozed, exists := service.Snooze(created.ID, until)

	if !exists {
		t.Fatal("Snooze() returned false for existing todo")
	}

	if snoozed.SnoozedUntil == nil {
		t.Error("Expected SnoozedUntil to be set")
	}

	if !snoozed.SnoozedUntil.Equal(until) {
		t.Errorf("SnoozedUntil = %v, want %v", snoozed.SnoozedUntil, until)
	}
}

func TestUnsnooze(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	created := service.Create(models.TodoCreate{Text: "Test Todo"})
	until := time.Now().Add(2 * time.Hour)
	service.Snooze(created.ID, until)

	unsnoozed, exists := service.Unsnooze(created.ID)

	if !exists {
		t.Fatal("Unsnooze() returned false for existing todo")
	}

	if unsnoozed.SnoozedUntil != nil {
		t.Error("Expected SnoozedUntil to be nil after unsnooze")
	}
}

func TestGetAllFiltersSnoozed(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	// Create a normal todo and a snoozed todo
	service.Create(models.TodoCreate{Text: "Active Todo"})
	snoozedTodo := service.Create(models.TodoCreate{Text: "Snoozed Todo"})
	
	// Snooze one todo
	future := time.Now().Add(2 * time.Hour)
	service.Snooze(snoozedTodo.ID, future)

	// GetAll should not include snoozed todos
	todos := service.GetAll("", "", "")
	
	if len(todos) != 1 {
		t.Errorf("Expected 1 todo (snoozed should be filtered), got %d", len(todos))
	}

	if todos[0].Text == "Snoozed Todo" {
		t.Error("Snoozed todo should not be in results")
	}
}

func TestGetUpcomingReminders(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	tomorrow := time.Now().Add(24 * time.Hour)
	tomorrowStr := tomorrow.Format("2006-01-02")
	nextWeekStr := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
	reminderTime := "10:00"

	// Create todos with different due dates
	service.Create(models.TodoCreate{
		Text:         "Due Tomorrow",
		DueDate:      &tomorrowStr,
		ReminderTime: &reminderTime,
	})

	service.Create(models.TodoCreate{
		Text:         "Due Next Week",
		DueDate:      &nextWeekStr,
		ReminderTime: &reminderTime,
	})

	// Get upcoming reminders (within 24 hours)
	reminders := service.GetUpcomingReminders()

	if len(reminders) != 1 {
		t.Errorf("Expected 1 upcoming reminder, got %d", len(reminders))
	}

	if reminders[0].Text != "Due Tomorrow" {
		t.Errorf("Expected 'Due Tomorrow', got %s", reminders[0].Text)
	}
}

func TestRecurrenceHandling(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	created := service.Create(models.TodoCreate{
		Text:           "Recurring Todo",
		RecurrenceRule: models.RecurrenceDaily,
		DueDate:        &tomorrow,
	})

	initialCount := len(service.todos)

	// Toggle to completed (should trigger recurrence)
	service.Toggle(created.ID)

	// Process recurring todos
	service.ProcessRecurringTodos()

	// Should have created a new occurrence
	if len(service.todos) <= initialCount {
		t.Error("Expected new todo to be created for recurring task")
	}
}

func TestGetByTag(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{
		Text: "Todo 1",
		Tags: []string{"work", "urgent"},
	})

	service.Create(models.TodoCreate{
		Text: "Todo 2",
		Tags: []string{"personal"},
	})

	service.Create(models.TodoCreate{
		Text: "Todo 3",
		Tags: []string{"work"},
	})

	workTodos := service.GetByTag("work")
	
	if len(workTodos) != 2 {
		t.Errorf("Expected 2 todos with 'work' tag, got %d", len(workTodos))
	}

	urgentTodos := service.GetByTag("urgent")
	
	if len(urgentTodos) != 1 {
		t.Errorf("Expected 1 todo with 'urgent' tag, got %d", len(urgentTodos))
	}
}

func TestGetByCategory(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	category1 := "Work"
	category2 := "Personal"

	service.Create(models.TodoCreate{
		Text:     "Todo 1",
		Category: &category1,
	})

	service.Create(models.TodoCreate{
		Text:     "Todo 2",
		Category: &category2,
	})

	service.Create(models.TodoCreate{
		Text:     "Todo 3",
		Category: &category1,
	})

	workTodos := service.GetByCategory("Work")
	
	if len(workTodos) != 2 {
		t.Errorf("Expected 2 todos in 'Work' category, got %d", len(workTodos))
	}
}

func TestGetAllTags(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{
		Text: "Todo 1",
		Tags: []string{"work", "urgent"},
	})

	service.Create(models.TodoCreate{
		Text: "Todo 2",
		Tags: []string{"personal", "urgent"},
	})

	tags := service.GetAllTags()
	
	if len(tags) < 3 {
		t.Errorf("Expected at least 3 unique tags, got %d", len(tags))
	}

	// Should contain work, personal, urgent
	tagMap := make(map[string]bool)
	for _, tag := range tags {
		tagMap[tag] = true
	}

	if !tagMap["work"] || !tagMap["personal"] || !tagMap["urgent"] {
		t.Error("Expected tags: work, personal, urgent")
	}
}

func TestBulkDelete(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo1 := service.Create(models.TodoCreate{Text: "Todo 1"})
	todo2 := service.Create(models.TodoCreate{Text: "Todo 2"})
	todo3 := service.Create(models.TodoCreate{Text: "Todo 3"})

	ids := []string{todo1.ID, todo2.ID}
	affected := service.BulkDelete(ids)

	if affected != 2 {
		t.Errorf("Expected 2 todos deleted, got %d", affected)
	}

	if len(service.todos) != 1 {
		t.Errorf("Expected 1 todo remaining, got %d", len(service.todos))
	}

	if _, exists := service.todos[todo3.ID]; !exists {
		t.Error("Expected todo3 to still exist")
	}
}

func TestBulkComplete(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo1 := service.Create(models.TodoCreate{Text: "Todo 1", Completed: false})
	todo2 := service.Create(models.TodoCreate{Text: "Todo 2", Completed: false})

	ids := []string{todo1.ID, todo2.ID}
	affected := service.BulkComplete(ids, true)

	if affected != 2 {
		t.Errorf("Expected 2 todos completed, got %d", affected)
	}

	// Verify todos are completed
	updated1, _ := service.GetByID(todo1.ID)
	updated2, _ := service.GetByID(todo2.ID)

	if !updated1.Completed || !updated2.Completed {
		t.Error("Expected todos to be completed")
	}
}

func TestImportTodos(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todosToImport := []models.TodoCreate{
		{Text: "Imported 1", Priority: models.PriorityHigh},
		{Text: "Imported 2", Priority: models.PriorityMedium},
	}

	result := service.ImportTodos(todosToImport, "append")

	if result.Imported != 2 {
		t.Errorf("Expected 2 imported, got %d", result.Imported)
	}

	if result.Skipped != 0 {
		t.Errorf("Expected 0 skipped, got %d", result.Skipped)
	}

	if len(service.todos) != 2 {
		t.Errorf("Expected 2 todos in storage, got %d", len(service.todos))
	}
}

func TestImportTodosReplace(t *testing.T) {
	service := NewTodoService()
	
	// Should have sample data
	initialCount := len(service.todos)
	if initialCount == 0 {
		t.Fatal("Expected sample data to be loaded")
	}

	todosToImport := []models.TodoCreate{
		{Text: "New Todo 1"},
	}

	result := service.ImportTodos(todosToImport, "replace")

	if result.Imported != 1 {
		t.Errorf("Expected 1 imported, got %d", result.Imported)
	}

	// Should have only 1 todo (replaced all)
	if len(service.todos) != 1 {
		t.Errorf("Expected 1 todo after replace, got %d", len(service.todos))
	}
}

func TestImportTodosValidation(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todosToImport := []models.TodoCreate{
		{Text: "Valid Todo"},
		{Text: ""}, // Invalid - empty text
		{Text: string(make([]byte, 600))}, // Invalid - too long
	}

	result := service.ImportTodos(todosToImport, "append")

	if result.Imported != 1 {
		t.Errorf("Expected 1 imported, got %d", result.Imported)
	}

	if result.Skipped != 2 {
		t.Errorf("Expected 2 skipped, got %d", result.Skipped)
	}

	if len(result.Errors) != 2 {
		t.Errorf("Expected 2 errors, got %d", len(result.Errors))
	}
}

func TestExportTodos(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Active", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed", Completed: true})

	result := service.ExportTodos("all")

	if result.Count != 2 {
		t.Errorf("Expected count 2, got %d", result.Count)
	}

	if len(result.Data) != 2 {
		t.Errorf("Expected 2 todos in data, got %d", len(result.Data))
	}

	if result.Format != "json" {
		t.Errorf("Expected format 'json', got %s", result.Format)
	}
}

func TestExportTodosWithFilter(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Active", Completed: false})
	service.Create(models.TodoCreate{Text: "Completed", Completed: true})

	result := service.ExportTodos("active")

	if result.Count != 1 {
		t.Errorf("Expected count 1, got %d", result.Count)
	}

	if result.Data[0].Completed {
		t.Error("Expected only active todos in export")
	}
}



