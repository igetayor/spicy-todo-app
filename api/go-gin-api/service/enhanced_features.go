package service

import (
	"spicytodo-go-api/models"
	"strconv"
	"strings"
	"time"
)

// Snooze a todo until a specific time
func (s *TodoService) Snooze(id string, until time.Time) (*models.Todo, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, exists := s.todos[id]
	if !exists {
		return nil, false
	}

	todo.SnoozedUntil = &until
	todo.UpdatedAt = time.Now()
	return todo, true
}

// Unsnooze a todo
func (s *TodoService) Unsnooze(id string) (*models.Todo, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, exists := s.todos[id]
	if !exists {
		return nil, false
	}

	todo.SnoozedUntil = nil
	todo.UpdatedAt = time.Now()
	return todo, true
}

// GetUpcomingReminders returns todos with reminders in the next 24 hours
func (s *TodoService) GetUpcomingReminders() []*models.Todo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	tomorrow := now.Add(24 * time.Hour)
	result := make([]*models.Todo, 0)

	for _, todo := range s.todos {
		if todo.Completed || todo.DueDate == nil || todo.ReminderTime == nil {
			continue
		}

		// Parse due date and reminder time
		dueDate, err := time.Parse("2006-01-02", *todo.DueDate)
		if err != nil {
			continue
		}

		parts := strings.Split(*todo.ReminderTime, ":")
		if len(parts) != 2 {
			continue
		}

		hour, err1 := strconv.Atoi(parts[0])
		minute, err2 := strconv.Atoi(parts[1])
		if err1 != nil || err2 != nil {
			continue
		}

		reminderTime := time.Date(
			dueDate.Year(), dueDate.Month(), dueDate.Day(),
			hour, minute, 0, 0, dueDate.Location(),
		)

		// Check if reminder is within next 24 hours
		if reminderTime.After(now) && reminderTime.Before(tomorrow) {
			result = append(result, todo)
		}
	}

	return result
}

// ProcessRecurringTodos handles recurring todo logic
func (s *TodoService) ProcessRecurringTodos() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, todo := range s.todos {
		if todo.Completed && todo.RecurrenceRule != models.RecurrenceNone {
			// Create next occurrence
			s.createNextOccurrence(todo)
		}
	}
}

func (s *TodoService) createNextOccurrence(todo *models.Todo) {
	if todo.DueDate == nil {
		return
	}

	dueDate, err := time.Parse("2006-01-02", *todo.DueDate)
	if err != nil {
		return
	}

	var nextDueDate time.Time
	switch todo.RecurrenceRule {
	case models.RecurrenceDaily:
		nextDueDate = dueDate.AddDate(0, 0, 1)
	case models.RecurrenceWeekly:
		nextDueDate = dueDate.AddDate(0, 0, 7)
	case models.RecurrenceMonthly:
		nextDueDate = dueDate.AddDate(0, 1, 0)
	default:
		return
	}

	nextDueDateStr := nextDueDate.Format("2006-01-02")
	now := time.Now()

	newTodo := &models.Todo{
		ID:             uuid.New().String(),
		Text:           todo.Text,
		Priority:       todo.Priority,
		Completed:      false,
		DueDate:        &nextDueDateStr,
		ReminderTime:   todo.ReminderTime,
		RecurrenceRule: todo.RecurrenceRule,
		Tags:           todo.Tags,
		Category:       todo.Category,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	s.todos[newTodo.ID] = newTodo
}

// GetByTag returns todos with a specific tag
func (s *TodoService) GetByTag(tag string) []*models.Todo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*models.Todo, 0)
	for _, todo := range s.todos {
		for _, t := range todo.Tags {
			if t == tag {
				result = append(result, todo)
				break
			}
		}
	}

	return result
}

// GetByCategory returns todos in a specific category
func (s *TodoService) GetByCategory(category string) []*models.Todo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*models.Todo, 0)
	for _, todo := range s.todos {
		if todo.Category != nil && *todo.Category == category {
			result = append(result, todo)
		}
	}

	return result
}

// GetAllTags returns all unique tags
func (s *TodoService) GetAllTags() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tagSet := make(map[string]bool)
	for _, todo := range s.todos {
		for _, tag := range todo.Tags {
			tagSet[tag] = true
		}
	}

	tags := make([]string, 0, len(tagSet))
	for tag := range tagSet {
		tags = append(tags, tag)
	}

	return tags
}

// GetAllCategories returns all unique categories
func (s *TodoService) GetAllCategories() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	categorySet := make(map[string]bool)
	for _, todo := range s.todos {
		if todo.Category != nil {
			categorySet[*todo.Category] = true
		}
	}

	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}

	return categories
}

// BulkDelete deletes multiple todos
func (s *TodoService) BulkDelete(ids []string) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	for _, id := range ids {
		if _, exists := s.todos[id]; exists {
			delete(s.todos, id)
			count++
		}
	}

	return count
}

// BulkComplete marks multiple todos as completed
func (s *TodoService) BulkComplete(ids []string, completed bool) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	for _, id := range ids {
		if todo, exists := s.todos[id]; exists {
			todo.Completed = completed
			todo.UpdatedAt = time.Now()
			
			// Handle recurring todos
			if completed && todo.RecurrenceRule != models.RecurrenceNone {
				s.createNextOccurrence(todo)
			}
			
			count++
		}
	}

	return count
}

// BulkUpdatePriority updates priority for multiple todos
func (s *TodoService) BulkUpdatePriority(ids []string, priority models.Priority) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	for _, id := range ids {
		if todo, exists := s.todos[id]; exists {
			todo.Priority = priority
			todo.UpdatedAt = time.Now()
			count++
		}
	}

	return count
}

// ImportTodos imports todos from a slice
func (s *TodoService) ImportTodos(todos []models.TodoCreate, mode string) models.ImportResult {
	s.mu.Lock()
	defer s.mu.Unlock()

	result := models.ImportResult{
		Message:    "Todos imported successfully",
		Imported:   0,
		Skipped:    0,
		Errors:     make([]string, 0),
		ImportedAt: time.Now().Format(time.RFC3339),
	}

	// Replace mode: clear existing todos
	if mode == "replace" {
		s.todos = make(map[string]*models.Todo)
	}

	for i, todoCreate := range todos {
		// Validate
		if todoCreate.Text == "" {
			result.Errors = append(result.Errors, "Row "+strconv.Itoa(i+1)+": Text is required")
			result.Skipped++
			continue
		}

		if len(todoCreate.Text) > 500 {
			result.Errors = append(result.Errors, "Row "+strconv.Itoa(i+1)+": Text too long")
			result.Skipped++
			continue
		}

		// Set defaults
		if todoCreate.Priority == "" {
			todoCreate.Priority = models.PriorityMedium
		}
		if todoCreate.RecurrenceRule == "" {
			todoCreate.RecurrenceRule = models.RecurrenceNone
		}

		now := time.Now()
		todo := &models.Todo{
			ID:             uuid.New().String(),
			Text:           todoCreate.Text,
			Priority:       todoCreate.Priority,
			Completed:      todoCreate.Completed,
			DueDate:        todoCreate.DueDate,
			ReminderTime:   todoCreate.ReminderTime,
			RecurrenceRule: todoCreate.RecurrenceRule,
			Tags:           todoCreate.Tags,
			Category:       todoCreate.Category,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		s.todos[todo.ID] = todo
		result.Imported++
	}

	return result
}

// ExportTodos exports todos with optional filter
func (s *TodoService) ExportTodos(filter string) models.ExportResult {
	s.mu.RLock()
	defer s.mu.RUnlock()

	todos := make([]models.Todo, 0)
	for _, todo := range s.todos {
		// Apply filter
		if filter == "active" && todo.Completed {
			continue
		}
		if filter == "completed" && !todo.Completed {
			continue
		}
		
		todos = append(todos, *todo)
	}

	return models.ExportResult{
		Data:       todos,
		Format:     "json",
		Count:      len(todos),
		ExportedAt: time.Now().Format(time.RFC3339),
		Filter:     filter,
	}
}
