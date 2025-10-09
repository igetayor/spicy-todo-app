package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"spicytodo-go-api/models"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCreateTodoWithAllFields(t *testing.T) {
	handler, _ := setupTestHandler()

	dueDate := "2024-12-31"
	reminderTime := "10:00"
	category := "Work"

	input := models.TodoCreate{
		Text:           "Full Todo",
		Priority:       models.PriorityHigh,
		Completed:      false,
		DueDate:        &dueDate,
		ReminderTime:   &reminderTime,
		RecurrenceRule: models.RecurrenceWeekly,
		Tags:           []string{"work", "urgent"},
		Category:       &category,
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.CreateTodo(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	
	var todo models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.Equal(t, input.Text, todo.Text)
	assert.Equal(t, input.RecurrenceRule, todo.RecurrenceRule)
	assert.Equal(t, len(input.Tags), len(todo.Tags))
}

func TestUpdateTodoPartialUpdate(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{
		Text:     "Original",
		Priority: models.PriorityLow,
	})

	// Only update text
	newText := "Updated Text Only"
	input := models.TodoUpdate{
		Text: &newText,
		// Other fields nil
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.UpdateTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todo models.Todo
	json.Unmarshal(w.Body.Bytes(), &todo)
	
	// Text should be updated
	assert.Equal(t, newText, todo.Text)
	// Priority should remain unchanged
	assert.Equal(t, models.PriorityLow, todo.Priority)
}

func TestGetTodosWithAllQueryParams(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{
		Text:      "High Active Work",
		Priority:  models.PriorityHigh,
		Completed: false,
	})
	svc.Create(models.TodoCreate{
		Text:      "Low Active Home",
		Priority:  models.PriorityLow,
		Completed: false,
	})
	svc.Create(models.TodoCreate{
		Text:      "High Completed",
		Priority:  models.PriorityHigh,
		Completed: true,
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/todos?filter=active&priority=high&search=Work", nil)
	
	handler.GetTodos(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	json.Unmarshal(w.Body.Bytes(), &todos)
	
	// Should only return "High Active Work"
	assert.Equal(t, 1, len(todos))
	assert.Equal(t, "High Active Work", todos[0].Text)
}

func TestCreateTodoMalformedJSON(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBufferString("{invalid json}"))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.CreateTodo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateTodoMalformedJSON(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test"})
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBufferString("{invalid}"))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.UpdateTodo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestToggleTodoMultipleTimes(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test", Completed: false})

	// Toggle 5 times
	for i := 0; i < 5; i++ {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: created.ID}}
		
		handler.ToggleTodo(c)
		
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Should be completed (started false, toggled 5 times)
	todo, _ := svc.GetByID(created.ID)
	assert.True(t, todo.Completed)
}

func TestGetStatsWithAllStatusCombinations(t *testing.T) {
	handler, svc := setupTestHandler()
	
	// Create todos with various combinations
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
	
	// Overdue
	svc.Create(models.TodoCreate{
		Text:      "Overdue",
		Priority:  models.PriorityHigh,
		Completed: false,
		DueDate:   &yesterday,
	})
	
	// Due today
	svc.Create(models.TodoCreate{
		Text:      "Due Today",
		Priority:  models.PriorityMedium,
		Completed: false,
		DueDate:   &today,
	})
	
	// Upcoming
	svc.Create(models.TodoCreate{
		Text:      "Upcoming",
		Priority:  models.PriorityLow,
		Completed: false,
		DueDate:   &tomorrow,
	})
	
	// Completed (should not count in due stats)
	svc.Create(models.TodoCreate{
		Text:      "Done",
		Completed: true,
		DueDate:   &yesterday,
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var stats models.TodoStats
	json.Unmarshal(w.Body.Bytes(), &stats)
	
	assert.Equal(t, 4, stats.Total)
	assert.Equal(t, 3, stats.Active)
	assert.Equal(t, 1, stats.Completed)
	assert.Equal(t, 1, stats.OverdueCount)
	assert.Equal(t, 1, stats.DueTodayCount)
	assert.Equal(t, 1, stats.UpcomingCount)
}

func TestClearCompletedMultipleTimes(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Active", Completed: false})
	svc.Create(models.TodoCreate{Text: "Done", Completed: true})

	// Clear completed
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	handler.ClearCompleted(c1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Clear again (should work even with no completed)
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	handler.ClearCompleted(c2)
	assert.Equal(t, http.StatusOK, w2.Code)

	todos := svc.GetAll("", "", "")
	assert.Equal(t, 1, len(todos))
}

func TestHealthCheckReturnsCorrectStructure(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetHealth(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "spicy-todo-go-api", response["service"])
	assert.NotNil(t, response["uptime"])
}

func TestRootEndpointStructure(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetRoot(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	assert.Contains(t, response["message"], "Spicy Todo API")
	assert.NotEmpty(t, response["version"])
	assert.NotEmpty(t, response["docs"])
}

func TestCreateTodoTextBoundaries(t *testing.T) {
	handler, _ := setupTestHandler()

	tests := []struct {
		name       string
		textLength int
		expectCode int
	}{
		{"Minimum length (1)", 1, http.StatusCreated},
		{"Normal length", 50, http.StatusCreated},
		{"Maximum length (500)", 500, http.StatusCreated},
		{"Over maximum (501)", 501, http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			text := string(make([]byte, tt.textLength))
			for i := range text {
				text = text[:i] + "a" + text[i+1:]
			}
			
			input := models.TodoCreate{Text: text}
			body, _ := json.Marshal(input)
			
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
			c.Request.Header.Set("Content-Type", "application/json")
			
			handler.CreateTodo(c)

			assert.Equal(t, tt.expectCode, w.Code)
		})
	}
}

func TestUpdateTodoWithEmptyUpdate(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{
		Text:     "Original",
		Priority: models.PriorityHigh,
	})

	// Empty update (no fields set)
	input := models.TodoUpdate{}
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.UpdateTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	// Todo should remain unchanged
	var todo models.Todo
	json.Unmarshal(w.Body.Bytes(), &todo)
	assert.Equal(t, "Original", todo.Text)
	assert.Equal(t, models.PriorityHigh, todo.Priority)
}

func TestDeleteSameTodoTwice(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "To Delete"})

	// First delete - should succeed
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.DeleteTodo(c1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Second delete - should fail (404)
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.DeleteTodo(c2)
	assert.Equal(t, http.StatusNotFound, w2.Code)
}

func TestGetTodosWithInvalidFilter(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Test", Completed: false})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/todos?filter=invalid", nil)
	
	handler.GetTodos(c)

	// Should still work, just ignore invalid filter
	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	json.Unmarshal(w.Body.Bytes(), &todos)
	assert.Equal(t, 1, len(todos))
}

func TestToggleRapidSuccession(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test", Completed: false})

	// Toggle 10 times rapidly
	for i := 0; i < 10; i++ {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: created.ID}}
		handler.ToggleTodo(c)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Should be false (started false, toggled even number of times)
	todo, _ := svc.GetByID(created.ID)
	assert.False(t, todo.Completed)
}

func TestCreateTodoWithLongTagList(t *testing.T) {
	handler, _ := setupTestHandler()

	// Create todo with many tags
	tags := make([]string, 50)
	for i := 0; i < 50; i++ {
		tags[i] = "tag" + string(rune(i))
	}

	input := models.TodoCreate{
		Text: "Many Tags",
		Tags: tags,
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.CreateTodo(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	
	var todo models.Todo
	json.Unmarshal(w.Body.Bytes(), &todo)
	assert.Equal(t, 50, len(todo.Tags))
}

func TestUpdateTodoChangePriorityMultipleTimes(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test"})

	priorities := []models.Priority{
		models.PriorityHigh,
		models.PriorityLow,
		models.PriorityMedium,
		models.PriorityHigh,
	}

	for _, priority := range priorities {
		input := models.TodoUpdate{Priority: &priority}
		body, _ := json.Marshal(input)
		
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Params = gin.Params{{Key: "id", Value: created.ID}}
		c.Request, _ = http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(body))
		c.Request.Header.Set("Content-Type", "application/json")
		
		handler.UpdateTodo(c)
		assert.Equal(t, http.StatusOK, w.Code)
	}

	// Final priority should be High
	todo, _ := svc.GetByID(created.ID)
	assert.Equal(t, models.PriorityHigh, todo.Priority)
}

func TestGetStatsWithNoTodos(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted() // Clear sample data
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var stats models.TodoStats
	json.Unmarshal(w.Body.Bytes(), &stats)
	
	assert.Equal(t, 0, stats.Total)
	assert.Equal(t, 0, stats.Active)
	assert.Equal(t, 0, stats.Completed)
	assert.Equal(t, 0.0, stats.CompletionRate)
}

func TestCreateUpdateDeleteLifecycle(t *testing.T) {
	handler, svc := setupTestHandler()

	// 1. Create
	input := models.TodoCreate{Text: "Lifecycle Test", Priority: models.PriorityMedium}
	body, _ := json.Marshal(input)
	
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
	c1.Request.Header.Set("Content-Type", "application/json")
	handler.CreateTodo(c1)
	
	var created models.Todo
	json.Unmarshal(w1.Body.Bytes(), &created)

	// 2. Read
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.GetTodoByID(c2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// 3. Update
	newText := "Updated"
	update := models.TodoUpdate{Text: &newText}
	updateBody, _ := json.Marshal(update)
	
	w3 := httptest.NewRecorder()
	c3, _ := gin.CreateTestContext(w3)
	c3.Params = gin.Params{{Key: "id", Value: created.ID}}
	c3.Request, _ = http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(updateBody))
	c3.Request.Header.Set("Content-Type", "application/json")
	handler.UpdateTodo(c3)
	assert.Equal(t, http.StatusOK, w3.Code)

	// 4. Toggle
	w4 := httptest.NewRecorder()
	c4, _ := gin.CreateTestContext(w4)
	c4.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.ToggleTodo(c4)
	assert.Equal(t, http.StatusOK, w4.Code)

	// 5. Delete
	w5 := httptest.NewRecorder()
	c5, _ := gin.CreateTestContext(w5)
	c5.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.DeleteTodo(c5)
	assert.Equal(t, http.StatusOK, w5.Code)

	// 6. Verify deleted
	_, exists := svc.GetByID(created.ID)
	assert.False(t, exists)
}

