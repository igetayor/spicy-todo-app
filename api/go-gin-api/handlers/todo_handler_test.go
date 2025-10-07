package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"spicytodo-go-api/models"
	"spicytodo-go-api/service"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestHandler() (*TodoHandler, *service.TodoService) {
	gin.SetMode(gin.TestMode)
	svc := service.NewTodoService()
	svc.ClearCompleted() // Clear sample data for clean tests
	handler := NewTodoHandler(svc)
	return handler, svc
}

func TestGetRoot(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetRoot(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response["message"], "Spicy Todo API")
}

func TestGetHealth(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetHealth(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestGetTodos(t *testing.T) {
	handler, svc := setupTestHandler()
	
	// Create test todos
	svc.Create(models.TodoCreate{Text: "Todo 1", Priority: models.PriorityHigh, Completed: false})
	svc.Create(models.TodoCreate{Text: "Todo 2", Priority: models.PriorityMedium, Completed: true})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/todos", nil)
	
	handler.GetTodos(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todos)
	assert.NoError(t, err)
	assert.Equal(t, 2, len(todos))
}

func TestGetTodosWithFilter(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Active Todo", Completed: false})
	svc.Create(models.TodoCreate{Text: "Completed Todo", Completed: true})

	tests := []struct {
		name     string
		filter   string
		expected int
	}{
		{"All todos", "", 2},
		{"Active only", "active", 1},
		{"Completed only", "completed", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request, _ = http.NewRequest("GET", "/api/todos?filter="+tt.filter, nil)
			
			handler.GetTodos(c)

			var todos []models.Todo
			json.Unmarshal(w.Body.Bytes(), &todos)
			assert.Equal(t, tt.expected, len(todos))
		})
	}
}

func TestCreateTodo(t *testing.T) {
	handler, _ := setupTestHandler()

	input := models.TodoCreate{
		Text:     "New Todo",
		Priority: models.PriorityHigh,
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
	assert.Equal(t, input.Priority, todo.Priority)
	assert.NotEmpty(t, todo.ID)
}

func TestCreateTodoInvalidInput(t *testing.T) {
	handler, _ := setupTestHandler()

	// Empty text
	input := models.TodoCreate{
		Text: "",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.CreateTodo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetTodoByID(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test Todo"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	
	handler.GetTodoByID(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todo models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.Equal(t, created.ID, todo.ID)
}

func TestGetTodoByIDNotFound(t *testing.T) {
	handler, _ := setupTestHandler()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "non-existent"}}
	
	handler.GetTodoByID(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestUpdateTodo(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Original"})

	newText := "Updated"
	input := models.TodoUpdate{
		Text: &newText,
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
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.Equal(t, newText, todo.Text)
}

func TestUpdateTodoNotFound(t *testing.T) {
	handler, _ := setupTestHandler()

	text := "Updated"
	input := models.TodoUpdate{Text: &text}
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "non-existent"}}
	c.Request, _ = http.NewRequest("PUT", "/api/todos/non-existent", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.UpdateTodo(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestDeleteTodo(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "To Delete"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	
	handler.DeleteTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	// Verify it's deleted
	_, exists := svc.GetByID(created.ID)
	assert.False(t, exists)
}

func TestDeleteTodoNotFound(t *testing.T) {
	handler, _ := setupTestHandler()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "non-existent"}}
	
	handler.DeleteTodo(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestToggleTodo(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "To Toggle", Completed: false})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	
	handler.ToggleTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todo models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.True(t, todo.Completed)
}

func TestToggleTodoNotFound(t *testing.T) {
	handler, _ := setupTestHandler()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "non-existent"}}
	
	handler.ToggleTodo(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetStats(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Todo 1", Completed: false})
	svc.Create(models.TodoCreate{Text: "Todo 2", Completed: true})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var stats models.TodoStats
	err := json.Unmarshal(w.Body.Bytes(), &stats)
	assert.NoError(t, err)
	assert.Equal(t, 2, stats.Total)
	assert.Equal(t, 1, stats.Active)
	assert.Equal(t, 1, stats.Completed)
}

func TestClearCompleted(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Active", Completed: false})
	svc.Create(models.TodoCreate{Text: "Completed", Completed: true})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.ClearCompleted(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	// Verify completed todos are cleared
	todos := svc.GetAll("", "", "")
	assert.Equal(t, 1, len(todos))
	assert.False(t, todos[0].Completed)
}

