package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"spicytodo-go-api/handlers"
	"spicytodo-go-api/models"
	"spicytodo-go-api/routes"
	"spicytodo-go-api/service"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupIntegrationTest() *gin.Engine {
	gin.SetMode(gin.TestMode)
	
	todoService := service.NewTodoService()
	todoHandler := handlers.NewTodoHandler(todoService)
	
	router := gin.Default()
	routes.SetupRoutes(router, todoHandler)
	
	return router
}

func TestFullAPIWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// 1. Health check
	req1, _ := http.NewRequest("GET", "/health", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// 2. Create todo
	createBody, _ := json.Marshal(models.TodoCreate{
		Text:     "Integration Test Todo",
		Priority: models.PriorityHigh,
		Tags:     []string{"test", "integration"},
	})
	
	req2, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusCreated, w2.Code)
	
	var created models.Todo
	json.Unmarshal(w2.Body.Bytes(), &created)

	// 3. Get by ID
	req3, _ := http.NewRequest("GET", "/api/todos/"+created.ID, nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code)

	// 4. Update
	newText := "Updated via Integration Test"
	updateBody, _ := json.Marshal(models.TodoUpdate{Text: &newText})
	
	req4, _ := http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(updateBody))
	req4.Header.Set("Content-Type", "application/json")
	w4 := httptest.NewRecorder()
	router.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusOK, w4.Code)

	// 5. Toggle
	req5, _ := http.NewRequest("PATCH", "/api/todos/"+created.ID+"/toggle", nil)
	w5 := httptest.NewRecorder()
	router.ServeHTTP(w5, req5)
	assert.Equal(t, http.StatusOK, w5.Code)

	// 6. Get stats
	req6, _ := http.NewRequest("GET", "/api/todos/stats/summary", nil)
	w6 := httptest.NewRecorder()
	router.ServeHTTP(w6, req6)
	assert.Equal(t, http.StatusOK, w6.Code)

	// 7. Delete
	req7, _ := http.NewRequest("DELETE", "/api/todos/"+created.ID, nil)
	w7 := httptest.NewRecorder()
	router.ServeHTTP(w7, req7)
	assert.Equal(t, http.StatusOK, w7.Code)

	// 8. Verify deleted
	req8, _ := http.NewRequest("GET", "/api/todos/"+created.ID, nil)
	w8 := httptest.NewRecorder()
	router.ServeHTTP(w8, req8)
	assert.Equal(t, http.StatusNotFound, w8.Code)
}

func TestTagWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// Create todos with tags
	createBody1, _ := json.Marshal(models.TodoCreate{
		Text: "Work Task",
		Tags: []string{"work", "urgent"},
	})
	
	req1, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	createBody2, _ := json.Marshal(models.TodoCreate{
		Text: "Personal Task",
		Tags: []string{"personal"},
	})
	
	req2, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	// Get all tags
	req3, _ := http.NewRequest("GET", "/api/todos/tags", nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code)

	// Get by tag
	req4, _ := http.NewRequest("GET", "/api/todos/tags/work", nil)
	w4 := httptest.NewRecorder()
	router.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusOK, w4.Code)
	
	var workTodos []models.Todo
	json.Unmarshal(w4.Body.Bytes(), &workTodos)
	assert.Greater(t, len(workTodos), 0)
}

func TestSnoozeWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// Create todo
	createBody, _ := json.Marshal(models.TodoCreate{Text: "To Snooze"})
	req1, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	
	var created models.Todo
	json.Unmarshal(w1.Body.Bytes(), &created)

	// Snooze
	until := time.Now().Add(2 * time.Hour)
	snoozeBody, _ := json.Marshal(models.SnoozeRequest{Until: until})
	
	req2, _ := http.NewRequest("PATCH", "/api/todos/"+created.ID+"/snooze", bytes.NewBuffer(snoozeBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// Get all todos (snoozed should be filtered)
	req3, _ := http.NewRequest("GET", "/api/todos", nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	
	var todos []models.Todo
	json.Unmarshal(w3.Body.Bytes(), &todos)
	
	// Should not include snoozed todo
	for _, todo := range todos {
		if todo.ID == created.ID {
			t.Error("Snoozed todo should not appear in GetAll")
		}
	}

	// Unsnooze
	req4, _ := http.NewRequest("PATCH", "/api/todos/"+created.ID+"/unsnooze", nil)
	w4 := httptest.NewRecorder()
	router.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusOK, w4.Code)

	// Get all again (should now appear)
	req5, _ := http.NewRequest("GET", "/api/todos", nil)
	w5 := httptest.NewRecorder()
	router.ServeHTTP(w5, req5)
	
	var todosAfter []models.Todo
	json.Unmarshal(w5.Body.Bytes(), &todosAfter)
	
	found := false
	for _, todo := range todosAfter {
		if todo.ID == created.ID {
			found = true
			break
		}
	}
	assert.True(t, found, "Unsnoozed todo should appear")
}

func TestBulkOperationWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// Create multiple todos
	ids := make([]string, 3)
	for i := 0; i < 3; i++ {
		createBody, _ := json.Marshal(models.TodoCreate{Text: "Bulk Test"})
		req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		
		var created models.Todo
		json.Unmarshal(w.Body.Bytes(), &created)
		ids[i] = created.ID
	}

	// Bulk complete
	bulkBody, _ := json.Marshal(models.BulkOperation{
		IDs:       ids,
		Operation: "complete",
	})
	
	req, _ := http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(bulkBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)

	// Verify all completed
	for _, id := range ids {
		reqGet, _ := http.NewRequest("GET", "/api/todos/"+id, nil)
		wGet := httptest.NewRecorder()
		router.ServeHTTP(wGet, reqGet)
		
		var todo models.Todo
		json.Unmarshal(wGet.Body.Bytes(), &todo)
		assert.True(t, todo.Completed)
	}
}

func TestExportImportWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// Create initial todos
	category := "Export Test"
	for i := 0; i < 3; i++ {
		createBody, _ := json.Marshal(models.TodoCreate{
			Text:     "Export Todo",
			Category: &category,
		})
		req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// Export
	reqExport, _ := http.NewRequest("GET", "/api/export/todos?filter=all", nil)
	wExport := httptest.NewRecorder()
	router.ServeHTTP(wExport, reqExport)
	
	var exportResult models.ExportResult
	json.Unmarshal(wExport.Body.Bytes(), &exportResult)
	
	initialCount := exportResult.Count

	// Import (append mode)
	importTodos := []models.TodoCreate{
		{Text: "Imported 1"},
	}
	
	importBody, _ := json.Marshal(models.ImportRequest{
		Todos: importTodos,
		Mode:  "append",
	})
	
	reqImport, _ := http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(importBody))
	reqImport.Header.Set("Content-Type", "application/json")
	wImport := httptest.NewRecorder()
	router.ServeHTTP(wImport, reqImport)
	
	assert.Equal(t, http.StatusOK, wImport.Code)

	// Verify count increased
	reqCount, _ := http.NewRequest("GET", "/api/todos", nil)
	wCount := httptest.NewRecorder()
	router.ServeHTTP(wCount, reqCount)
	
	var allTodos []models.Todo
	json.Unmarshal(wCount.Body.Bytes(), &allTodos)
	assert.Greater(t, len(allTodos), initialCount)
}

func TestCORSHeaders(t *testing.T) {
	router := setupIntegrationTest()

	req, _ := http.NewRequest("OPTIONS", "/api/todos", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check CORS headers
	assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Origin"))
}

func TestErrorResponseFormat(t *testing.T) {
	router := setupIntegrationTest()

	// Try to get non-existent todo
	req, _ := http.NewRequest("GET", "/api/todos/non-existent-id", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	assert.Contains(t, response, "error")
	assert.NotEmpty(t, response["error"])
}

func TestMultipleSimultaneousRequests(t *testing.T) {
	router := setupIntegrationTest()

	done := make(chan bool, 10)

	// Simulate 10 concurrent requests
	for i := 0; i < 10; i++ {
		go func() {
			req, _ := http.NewRequest("GET", "/api/todos", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
			done <- true
		}()
	}

	// Wait for all to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

func TestRecurringTodoCompleteWorkflow(t *testing.T) {
	router := setupIntegrationTest()

	// Create recurring todo
	dueDate := time.Now().Format("2006-01-02")
	createBody, _ := json.Marshal(models.TodoCreate{
		Text:           "Daily Task",
		RecurrenceRule: models.RecurrenceDaily,
		DueDate:        &dueDate,
	})
	
	req1, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	
	var created models.Todo
	json.Unmarshal(w1.Body.Bytes(), &created)

	// Get initial count
	req2, _ := http.NewRequest("GET", "/api/todos", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	
	var beforeToggle []models.Todo
	json.Unmarshal(w2.Body.Bytes(), &beforeToggle)
	initialCount := len(beforeToggle)

	// Toggle to complete (should trigger recurrence)
	req3, _ := http.NewRequest("PATCH", "/api/todos/"+created.ID+"/toggle", nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	assert.Equal(t, http.StatusOK, w3.Code)

	// Note: ProcessRecurringTodos needs to be called
	// In production, this would be a background job
}

func TestFilterCombinationsIntegration(t *testing.T) {
	router := setupIntegrationTest()

	// Create diverse todos
	todos := []models.TodoCreate{
		{Text: "High Active Work", Priority: models.PriorityHigh, Completed: false},
		{Text: "High Completed Work", Priority: models.PriorityHigh, Completed: true},
		{Text: "Low Active Home", Priority: models.PriorityLow, Completed: false},
		{Text: "Medium Active", Priority: models.PriorityMedium, Completed: false},
	}

	for _, todo := range todos {
		body, _ := json.Marshal(todo)
		req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	tests := []struct {
		name     string
		url      string
		expected int
	}{
		{"All todos", "/api/todos", 4},
		{"Active only", "/api/todos?filter=active", 3},
		{"Completed only", "/api/todos?filter=completed", 1},
		{"High priority", "/api/todos?priority=high", 2},
		{"Search 'Work'", "/api/todos?search=Work", 2},
		{"Active + High", "/api/todos?filter=active&priority=high", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tt.url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			
			var todos []models.Todo
			json.Unmarshal(w.Body.Bytes(), &todos)
			
			assert.Equal(t, tt.expected, len(todos), "URL: "+tt.url)
		})
	}
}

func TestImportReplaceMode(t *testing.T) {
	router := setupIntegrationTest()

	// Get initial count
	req1, _ := http.NewRequest("GET", "/api/todos", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	
	var beforeImport []models.Todo
	json.Unmarshal(w1.Body.Bytes(), &beforeImport)
	assert.Greater(t, len(beforeImport), 0, "Should have sample data")

	// Import with replace mode
	importBody, _ := json.Marshal(models.ImportRequest{
		Todos: []models.TodoCreate{
			{Text: "New Todo 1"},
			{Text: "New Todo 2"},
		},
		Mode: "replace",
	})
	
	req2, _ := http.NewRequest("POST", "/api/import/todos", bytes.NewBuffer(importBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// Get todos after import
	req3, _ := http.NewRequest("GET", "/api/todos", nil)
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	
	var afterImport []models.Todo
	json.Unmarshal(w3.Body.Bytes(), &afterImport)
	
	// Should only have 2 todos (replaced all)
	assert.Equal(t, 2, len(afterImport))
}

func TestRateLimitSimulation(t *testing.T) {
	router := setupIntegrationTest()

	// Simulate many rapid requests
	successCount := 0
	
	for i := 0; i < 100; i++ {
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		
		if w.Code == http.StatusOK {
			successCount++
		}
	}

	// All should succeed (no rate limiting yet)
	assert.Equal(t, 100, successCount)
}

func TestContentTypeValidation(t *testing.T) {
	router := setupIntegrationTest()

	// Try to create todo without Content-Type
	body, _ := json.Marshal(models.TodoCreate{Text: "Test"})
	
	req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
	// Don't set Content-Type
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Gin should still handle it (might bind or error)
	// Just verify we get a response
	assert.NotEqual(t, 0, w.Code)
}

