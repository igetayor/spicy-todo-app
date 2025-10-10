package service

import (
	"spicytodo-go-api/models"
	"testing"
	"time"
)

func TestSnoozeInThePast(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo := service.Create(models.TodoCreate{Text: "Test"})
	
	// Snooze in the past
	pastTime := time.Now().Add(-2 * time.Hour)
	snoozed, _ := service.Snooze(todo.ID, pastTime)

	// Should still set the time (validation could be added)
	if snoozed.SnoozedUntil == nil {
		t.Error("SnoozedUntil should be set even for past time")
	}

	// GetAll should include it (snooze time has passed)
	todos := service.GetAll("", "", "")
	if len(todos) != 1 {
		t.Error("Todo snoozed in past should appear in GetAll")
	}
}

func TestSnoozeNonExistentTodo(t *testing.T) {
	service := NewTodoService()
	
	until := time.Now().Add(2 * time.Hour)
	_, exists := service.Snooze("non-existent", until)

	if exists {
		t.Error("Snooze() should return false for non-existent todo")
	}
}

func TestUnsnoozeNonExistentTodo(t *testing.T) {
	service := NewTodoService()
	
	_, exists := service.Unsnooze("non-existent")

	if exists {
		t.Error("Unsnooze() should return false for non-existent todo")
	}
}

func TestUnsnoozeAlreadyUnsnoozed(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo := service.Create(models.TodoCreate{Text: "Test"})
	
	// Unsnooze without snoozing first
	unsnoozed, _ := service.Unsnooze(todo.ID)

	if unsnoozed.SnoozedUntil != nil {
		t.Error("SnoozedUntil should remain nil")
	}
}

func TestGetUpcomingRemindersWithNoReminders(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "No reminder"})

	reminders := service.GetUpcomingReminders()
	
	if len(reminders) != 0 {
		t.Errorf("Expected 0 reminders, got %d", len(reminders))
	}
}

func TestGetUpcomingRemindersWithInvalidTime(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
	invalidTime := "25:99" // Invalid time

	service.Create(models.TodoCreate{
		Text:         "Invalid Time",
		DueDate:      &tomorrow,
		ReminderTime: &invalidTime,
	})

	reminders := service.GetUpcomingReminders()
	
	// Should skip todos with invalid times
	if len(reminders) != 0 {
		t.Error("Should skip todos with invalid reminder times")
	}
}

func TestGetUpcomingRemindersExcludesCompleted(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	tomorrow := time.Now().Add(12 * time.Hour).Format("2006-01-02")
	reminderTime := "10:00"

	service.Create(models.TodoCreate{
		Text:         "Completed Todo",
		DueDate:      &tomorrow,
		ReminderTime: &reminderTime,
		Completed:    true,
	})

	reminders := service.GetUpcomingReminders()
	
	if len(reminders) != 0 {
		t.Error("Should not include completed todos in reminders")
	}
}

func TestProcessRecurringTodosWithNoDueDate(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo := service.Create(models.TodoCreate{
		Text:           "No Due Date",
		RecurrenceRule: models.RecurrenceDaily,
		Completed:      true,
	})

	initialCount := len(service.todos)
	service.ProcessRecurringTodos()

	// Should not create new occurrence without due date
	if len(service.todos) != initialCount {
		t.Error("Should not create occurrence for recurring todo without due date")
	}
}

func TestGetByTagWithNoTags(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "No Tags"})

	todos := service.GetByTag("anything")
	
	if len(todos) != 0 {
		t.Errorf("Expected 0 todos with tag, got %d", len(todos))
	}
}

func TestGetByTagWithMultipleTags(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{
		Text: "Multi Tag",
		Tags: []string{"work", "urgent", "meeting"},
	})

	// Should find by any of the tags
	workTodos := service.GetByTag("work")
	urgentTodos := service.GetByTag("urgent")
	meetingTodos := service.GetByTag("meeting")

	if len(workTodos) != 1 || len(urgentTodos) != 1 || len(meetingTodos) != 1 {
		t.Error("Should find todo by any of its tags")
	}
}

func TestGetByCategoryWithNoCategory(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "No Category"})

	todos := service.GetByCategory("Work")
	
	if len(todos) != 0 {
		t.Errorf("Expected 0 todos in category, got %d", len(todos))
	}
}

func TestGetAllTagsWithDuplicates(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "Todo 1", Tags: []string{"work", "urgent"}})
	service.Create(models.TodoCreate{Text: "Todo 2", Tags: []string{"work", "meeting"}})
	service.Create(models.TodoCreate{Text: "Todo 3", Tags: []string{"urgent"}})

	tags := service.GetAllTags()

	// Should have 3 unique tags: work, urgent, meeting
	if len(tags) != 3 {
		t.Errorf("Expected 3 unique tags, got %d", len(tags))
	}

	// Verify uniqueness
	tagMap := make(map[string]int)
	for _, tag := range tags {
		tagMap[tag]++
	}

	for tag, count := range tagMap {
		if count != 1 {
			t.Errorf("Tag %s appears %d times, should be unique", tag, count)
		}
	}
}

func TestBulkDeleteWithSomeNonExistent(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo1 := service.Create(models.TodoCreate{Text: "Exists"})
	
	ids := []string{todo1.ID, "non-existent-1", "non-existent-2"}
	affected := service.BulkDelete(ids)

	if affected != 1 {
		t.Errorf("Expected 1 deleted, got %d", affected)
	}
}

func TestBulkDeleteEmptyList(t *testing.T) {
	service := NewTodoService()
	
	affected := service.BulkDelete([]string{})

	if affected != 0 {
		t.Errorf("Expected 0 deleted for empty list, got %d", affected)
	}
}

func TestBulkCompleteWithRecurrence(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	dueDate := time.Now().Format("2006-01-02")
	
	todo := service.Create(models.TodoCreate{
		Text:           "Recurring",
		RecurrenceRule: models.RecurrenceDaily,
		DueDate:        &dueDate,
	})

	initialCount := len(service.todos)
	
	service.BulkComplete([]string{todo.ID}, true)

	// Should have created new occurrence
	if len(service.todos) <= initialCount {
		t.Error("Expected new occurrence for recurring todo")
	}
}

func TestImportTodosWithEmptyList(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	result := service.ImportTodos([]models.TodoCreate{}, "append")

	if result.Imported != 0 {
		t.Errorf("Expected 0 imported, got %d", result.Imported)
	}
	if result.Skipped != 0 {
		t.Errorf("Expected 0 skipped, got %d", result.Skipped)
	}
}

func TestImportTodosWithAllInvalid(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todosToImport := []models.TodoCreate{
		{Text: ""},                         // Empty text
		{Text: string(make([]byte, 600))}, // Too long
	}

	result := service.ImportTodos(todosToImport, "append")

	if result.Imported != 0 {
		t.Errorf("Expected 0 imported, got %d", result.Imported)
	}
	if result.Skipped != 2 {
		t.Errorf("Expected 2 skipped, got %d", result.Skipped)
	}
	if len(result.Errors) != 2 {
		t.Errorf("Expected 2 errors, got %d", len(result.Errors))
	}
}

func TestImportTodosInvalidMode(t *testing.T) {
	service := NewTodoService()
	
	todosToImport := []models.TodoCreate{
		{Text: "Test"},
	}

	// Mode validation happens in handler, but test service behavior
	result := service.ImportTodos(todosToImport, "invalid-mode")

	// Service should still process (handler validates mode)
	if result.Imported != 1 {
		t.Errorf("Service should import regardless of mode, got %d", result.Imported)
	}
}

func TestExportTodosWithEmptyService(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	result := service.ExportTodos("all")

	if result.Count != 0 {
		t.Errorf("Expected count 0, got %d", result.Count)
	}
	if len(result.Data) != 0 {
		t.Errorf("Expected empty data array, got %d items", len(result.Data))
	}
}

func TestGetAllCategoriesWithNoCategories(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	service.Create(models.TodoCreate{Text: "No Category"})

	categories := service.GetAllCategories()
	
	if len(categories) != 0 {
		t.Errorf("Expected 0 categories, got %d", len(categories))
	}
}

func TestBulkUpdatePriorityWithNonExistent(t *testing.T) {
	service := NewTodoService()
	service.todos = make(map[string]*models.Todo)

	todo := service.Create(models.TodoCreate{Text: "Exists"})
	
	ids := []string{todo.ID, "non-existent"}
	affected := service.BulkUpdatePriority(ids, models.PriorityHigh)

	if affected != 1 {
		t.Errorf("Expected 1 updated, got %d", affected)
	}

	// Verify priority was updated
	updated, _ := service.GetByID(todo.ID)
	if updated.Priority != models.PriorityHigh {
		t.Error("Priority not updated")
	}
}


