package service

import (
	"spicytodo-go-api/models"
	"sync"
	"time"

	"github.com/google/uuid"
)

type TodoService struct {
	todos map[string]*models.Todo
	mu    sync.RWMutex
}

func NewTodoService() *TodoService {
	service := &TodoService{
		todos: make(map[string]*models.Todo),
	}
	service.loadSampleData()
	return service
}

func (s *TodoService) GetAll(filter, search, priority string) []*models.Todo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*models.Todo, 0)
	for _, todo := range s.todos {
		// Apply filters
		if filter == "active" && todo.Completed {
			continue
		}
		if filter == "completed" && !todo.Completed {
			continue
		}
		if priority != "" && string(todo.Priority) != priority {
			continue
		}
		if search != "" && !contains(todo.Text, search) {
			continue
		}
		result = append(result, todo)
	}

	return result
}

func (s *TodoService) GetByID(id string) (*models.Todo, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	todo, exists := s.todos[id]
	return todo, exists
}

func (s *TodoService) Create(input models.TodoCreate) *models.Todo {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Set default priority
	if input.Priority == "" {
		input.Priority = models.PriorityMedium
	}

	now := time.Now()
	todo := &models.Todo{
		ID:           uuid.New().String(),
		Text:         input.Text,
		Priority:     input.Priority,
		Completed:    input.Completed,
		DueDate:      input.DueDate,
		ReminderTime: input.ReminderTime,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	s.todos[todo.ID] = todo
	return todo
}

func (s *TodoService) Update(id string, input models.TodoUpdate) (*models.Todo, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, exists := s.todos[id]
	if !exists {
		return nil, false
	}

	// Update fields if provided
	if input.Text != nil {
		todo.Text = *input.Text
	}
	if input.Priority != nil {
		todo.Priority = *input.Priority
	}
	if input.Completed != nil {
		todo.Completed = *input.Completed
	}
	if input.DueDate != nil {
		todo.DueDate = input.DueDate
	}
	if input.ReminderTime != nil {
		todo.ReminderTime = input.ReminderTime
	}

	todo.UpdatedAt = time.Now()
	return todo, true
}

func (s *TodoService) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.todos[id]; !exists {
		return false
	}

	delete(s.todos, id)
	return true
}

func (s *TodoService) Toggle(id string) (*models.Todo, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	todo, exists := s.todos[id]
	if !exists {
		return nil, false
	}

	todo.Completed = !todo.Completed
	todo.UpdatedAt = time.Now()
	return todo, true
}

func (s *TodoService) GetStats() models.TodoStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats := models.TodoStats{
		Total:             len(s.todos),
		Active:            0,
		Completed:         0,
		CompletionRate:    0,
		PriorityBreakdown: make(map[string]int),
		OverdueCount:      0,
		DueTodayCount:     0,
		UpcomingCount:     0,
	}

	today := time.Now().Format("2006-01-02")

	for _, todo := range s.todos {
		if todo.Completed {
			stats.Completed++
		} else {
			stats.Active++
		}

		stats.PriorityBreakdown[string(todo.Priority)]++

		if todo.DueDate != nil && !todo.Completed {
			dueDate := *todo.DueDate
			if dueDate < today {
				stats.OverdueCount++
			} else if dueDate == today {
				stats.DueTodayCount++
			} else if isWithinDays(dueDate, today, 7) {
				stats.UpcomingCount++
			}
		}
	}

	if stats.Total > 0 {
		stats.CompletionRate = float64(stats.Completed) / float64(stats.Total) * 100
	}

	return stats
}

func (s *TodoService) ClearCompleted() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, todo := range s.todos {
		if todo.Completed {
			delete(s.todos, id)
		}
	}
}

func (s *TodoService) loadSampleData() {
	now := time.Now()
	tomorrow := now.AddDate(0, 0, 1).Format("2006-01-02")
	nextWeek := now.AddDate(0, 0, 7).Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	sampleTodos := []models.Todo{
		{
			ID:           uuid.New().String(),
			Text:         "Learn Go programming language",
			Priority:     models.PriorityHigh,
			Completed:    false,
			DueDate:      &tomorrow,
			ReminderTime: strPtr("09:00"),
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		{
			ID:           uuid.New().String(),
			Text:         "Build a todo API with Gin framework",
			Priority:     models.PriorityHigh,
			Completed:    true,
			DueDate:      &yesterday,
			ReminderTime: strPtr("14:30"),
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		{
			ID:           uuid.New().String(),
			Text:         "Add Docker support for deployment",
			Priority:     models.PriorityMedium,
			Completed:    false,
			DueDate:      &nextWeek,
			ReminderTime: strPtr("16:00"),
			CreatedAt:    now,
			UpdatedAt:    now,
		},
		{
			ID:        uuid.New().String(),
			Text:      "Write unit tests for all endpoints",
			Priority:  models.PriorityMedium,
			Completed: false,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:        uuid.New().String(),
			Text:      "Optimize database queries",
			Priority:  models.PriorityLow,
			Completed: false,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for _, todo := range sampleTodos {
		s.todos[todo.ID] = &todo
	}
}

// Helper functions
func contains(text, substr string) bool {
	return len(text) >= len(substr) && (text == substr || len(substr) == 0 ||
		(len(text) > 0 && len(substr) > 0 && containsIgnoreCase(text, substr)))
}

func containsIgnoreCase(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if toLower(s[i+j]) != toLower(substr[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func toLower(b byte) byte {
	if b >= 'A' && b <= 'Z' {
		return b + 32
	}
	return b
}

func isWithinDays(dateStr, today string, days int) bool {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return false
	}
	todayDate, err := time.Parse("2006-01-02", today)
	if err != nil {
		return false
	}
	diff := date.Sub(todayDate).Hours() / 24
	return diff > 0 && diff <= float64(days)
}

func strPtr(s string) *string {
	return &s
}

