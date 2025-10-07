package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"spicytodo-go-api/models"
	"spicytodo-go-api/service"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSnoozeTodo(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test Todo"})
	
	until := time.Now().Add(2 * time.Hour)
	input := models.SnoozeRequest{Until: until}
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PATCH", "/api/todos/"+created.ID+"/snooze", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.SnoozeTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todo models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.NotNil(t, todo.SnoozedUntil)
}

func TestUnsnoozeTodo(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test Todo"})
	until := time.Now().Add(2 * time.Hour)
	svc.Snooze(created.ID, until)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	
	handler.UnsnoozeTodo(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todo models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todo)
	assert.NoError(t, err)
	assert.Nil(t, todo.SnoozedUntil)
}

func TestGetUpcomingReminders(t *testing.T) {
	handler, svc := setupTestHandler()
	
	tomorrow := time.Now().Add(12 * time.Hour).Format("2006-01-02")
	reminderTime := "10:00"
	
	svc.Create(models.TodoCreate{
		Text:         "Has Reminder",
		DueDate:      &tomorrow,
		ReminderTime: &reminderTime,
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetUpcomingReminders(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todos)
	assert.NoError(t, err)
}

func TestGetByTag(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{
		Text: "Work Todo",
		Tags: []string{"work", "urgent"},
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "tag", Value: "work"}}
	
	handler.GetByTag(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	err := json.Unmarshal(w.Body.Bytes(), &todos)
	assert.NoError(t, err)
	assert.Equal(t, 1, len(todos))
}

func TestGetAllTags(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{
		Text: "Todo 1",
		Tags: []string{"work", "urgent"},
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetAllTags(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string][]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.NotEmpty(t, response["tags"])
}

func TestBulkOperation(t *testing.T) {
	handler, svc := setupTestHandler()
	
	todo1 := svc.Create(models.TodoCreate{Text: "Todo 1"})
	todo2 := svc.Create(models.TodoCreate{Text: "Todo 2"})

	input := models.BulkOperation{
		IDs:       []string{todo1.ID, todo2.ID},
		Operation: "complete",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.BulkOperation(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(2), response["affected"])
}

func TestBulkDelete(t *testing.T) {
	handler, svc := setupTestHandler()
	
	todo1 := svc.Create(models.TodoCreate{Text: "Todo 1"})
	todo2 := svc.Create(models.TodoCreate{Text: "Todo 2"})

	input := models.BulkOperation{
		IDs:       []string{todo1.ID, todo2.ID},
		Operation: "delete",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.BulkOperation(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	// Verify todos are deleted
	_, exists1 := svc.GetByID(todo1.ID)
	_, exists2 := svc.GetByID(todo2.ID)
	assert.False(t, exists1)
	assert.False(t, exists2)
}

func TestExportTodos(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Todo 1"})
	svc.Create(models.TodoCreate{Text: "Todo 2"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/export/todos", nil)
	
	handler.ExportTodos(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	// Check headers
	assert.Contains(t, w.Header().Get("Content-Type"), "application/json")
	assert.Contains(t, w.Header().Get("Content-Disposition"), "attachment")
	
	var result models.ExportResult
	err := json.Unmarshal(w.Body.Bytes(), &result)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Count)
}

func TestImportTodos(t *testing.T) {
	handler, _ := setupTestHandler()

	input := models.ImportRequest{
		Todos: []models.TodoCreate{
			{Text: "Imported 1", Priority: models.PriorityHigh},
			{Text: "Imported 2", Priority: models.PriorityLow},
		},
		Mode: "append",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.ImportTodos(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var result models.ImportResult
	err := json.Unmarshal(w.Body.Bytes(), &result)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Imported)
	assert.Equal(t, 0, result.Skipped)
}

