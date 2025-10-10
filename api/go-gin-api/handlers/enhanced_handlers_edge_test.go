package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"spicytodo-go-api/models"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSnoozeTodoInvalidJSON(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test"})
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PATCH", "/api/todos/"+created.ID+"/snooze", 
		bytes.NewBufferString("{invalid}"))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.SnoozeTodo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSnoozeTodoMissingUntilField(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test"})
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: created.ID}}
	c.Request, _ = http.NewRequest("PATCH", "/api/todos/"+created.ID+"/snooze", 
		bytes.NewBufferString("{}"))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.SnoozeTodo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSnoozeAndUnsnoozeSequence(t *testing.T) {
	handler, svc := setupTestHandler()
	
	created := svc.Create(models.TodoCreate{Text: "Test"})

	// Snooze
	until := time.Now().Add(2 * time.Hour)
	input := models.SnoozeRequest{Until: until}
	body, _ := json.Marshal(input)
	
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Params = gin.Params{{Key: "id", Value: created.ID}}
	c1.Request, _ = http.NewRequest("PATCH", "/api/todos/"+created.ID+"/snooze", bytes.NewBuffer(body))
	c1.Request.Header.Set("Content-Type", "application/json")
	handler.SnoozeTodo(c1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Unsnooze
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Params = gin.Params{{Key: "id", Value: created.ID}}
	handler.UnsnoozeTodo(c2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// Verify
	todo, _ := svc.GetByID(created.ID)
	assert.Nil(t, todo.SnoozedUntil)
}

func TestGetUpcomingRemindersEmpty(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetUpcomingReminders(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var reminders []models.Todo
	json.Unmarshal(w.Body.Bytes(), &reminders)
	assert.Equal(t, 0, len(reminders))
}

func TestGetByTagNonExistent(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted()
	
	svc.Create(models.TodoCreate{
		Text: "Test",
		Tags: []string{"work"},
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "tag", Value: "nonexistent"}}
	
	handler.GetByTag(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	json.Unmarshal(w.Body.Bytes(), &todos)
	assert.Equal(t, 0, len(todos))
}

func TestGetByCategoryNonExistent(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "category", Value: "NonExistent"}}
	
	handler.GetByCategory(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var todos []models.Todo
	json.Unmarshal(w.Body.Bytes(), &todos)
	assert.Equal(t, 0, len(todos))
}

func TestGetAllTagsEmpty(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted()
	
	svc.Create(models.TodoCreate{Text: "No Tags"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	handler.GetAllTags(c)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string][]string
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, 0, len(response["tags"]))
}

func TestBulkOperationInvalidOperation(t *testing.T) {
	handler, svc := setupTestHandler()
	
	todo := svc.Create(models.TodoCreate{Text: "Test"})

	input := models.BulkOperation{
		IDs:       []string{todo.ID},
		Operation: "invalid_operation",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.BulkOperation(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBulkOperationEmptyIDList(t *testing.T) {
	handler, _ := setupTestHandler()

	input := models.BulkOperation{
		IDs:       []string{},
		Operation: "complete",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.BulkOperation(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBulkOperationUpdatePriorityMissingData(t *testing.T) {
	handler, svc := setupTestHandler()
	
	todo := svc.Create(models.TodoCreate{Text: "Test"})

	input := models.BulkOperation{
		IDs:       []string{todo.ID},
		Operation: "updatePriority",
		// Missing Data field
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.BulkOperation(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestExportTodosInvalidFilter(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Test"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/export/todos?filter=invalid", nil)
	
	handler.ExportTodos(c)

	// Should still work, treat as "all"
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestExportTodosCheckHeaders(t *testing.T) {
	handler, svc := setupTestHandler()
	
	svc.Create(models.TodoCreate{Text: "Test"})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/export/todos?filter=all", nil)
	
	handler.ExportTodos(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "application/json")
	assert.Contains(t, w.Header().Get("Content-Disposition"), "attachment")
	assert.Contains(t, w.Header().Get("Content-Disposition"), "todos_all_")
}

func TestImportTodosMissingMode(t *testing.T) {
	handler, _ := setupTestHandler()

	input := models.ImportRequest{
		Todos: []models.TodoCreate{
			{Text: "Test"},
		},
		// Mode not specified
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.ImportTodos(c)

	// Should default to "append"
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestImportTodosInvalidMode(t *testing.T) {
	handler, _ := setupTestHandler()

	input := models.ImportRequest{
		Todos: []models.TodoCreate{{Text: "Test"}},
		Mode:  "invalid_mode",
	}
	
	body, _ := json.Marshal(input)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(body))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.ImportTodos(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestImportTodosMalformedJSON(t *testing.T) {
	handler, _ := setupTestHandler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/import/todos", 
		bytes.NewBufferString("{invalid json}"))
	c.Request.Header.Set("Content-Type", "application/json")
	
	handler.ImportTodos(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestImportExportRoundTrip(t *testing.T) {
	handler, svc := setupTestHandler()
	svc.ClearCompleted()
	
	// Create test todos
	category := "Test"
	svc.Create(models.TodoCreate{
		Text:     "Todo 1",
		Priority: models.PriorityHigh,
		Tags:     []string{"tag1"},
		Category: &category,
	})

	// Export
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Request, _ = http.NewRequest("GET", "/api/export/todos", nil)
	handler.ExportTodos(c1)

	var exportResult models.ExportResult
	json.Unmarshal(w1.Body.Bytes(), &exportResult)

	// Clear todos
	svc.ClearCompleted()
	for id := range svc.todos {
		svc.Delete(id)
	}

	// Import back
	importTodos := make([]models.TodoCreate, len(exportResult.Data))
	for i, todo := range exportResult.Data {
		importTodos[i] = models.TodoCreate{
			Text:     todo.Text,
			Priority: todo.Priority,
			Tags:     todo.Tags,
			Category: todo.Category,
		}
	}

	importReq := models.ImportRequest{
		Todos: importTodos,
		Mode:  "append",
	}
	
	importBody, _ := json.Marshal(importReq)
	
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Request, _ = http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(importBody))
	c2.Request.Header.Set("Content-Type", "application/json")
	
	handler.ImportTodos(c2)

	assert.Equal(t, http.StatusOK, w2.Code)
	
	// Should have same number of todos
	todos := svc.GetAll("", "", "")
	assert.Equal(t, exportResult.Count, len(todos))
}


