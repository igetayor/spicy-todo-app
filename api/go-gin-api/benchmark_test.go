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

	"github.com/gin-gonic/gin"
)

func setupBenchmark() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	
	todoService := service.NewTodoService()
	todoHandler := handlers.NewTodoHandler(todoService)
	
	router := gin.New() // Don't use Default to avoid logging overhead
	routes.SetupRoutes(router, todoHandler)
	
	return router
}

func BenchmarkGetAllTodos(b *testing.B) {
	router := setupBenchmark()
	req, _ := http.NewRequest("GET", "/api/todos", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkGetTodoByID(b *testing.B) {
	router := setupBenchmark()
	
	// Create a todo first
	createBody, _ := json.Marshal(models.TodoCreate{Text: "Benchmark"})
	reqCreate, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")
	wCreate := httptest.NewRecorder()
	router.ServeHTTP(wCreate, reqCreate)
	
	var created models.Todo
	json.Unmarshal(wCreate.Body.Bytes(), &created)

	req, _ := http.NewRequest("GET", "/api/todos/"+created.ID, nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkCreateTodo(b *testing.B) {
	router := setupBenchmark()
	
	body, _ := json.Marshal(models.TodoCreate{
		Text:     "Benchmark Todo",
		Priority: models.PriorityMedium,
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkUpdateTodo(b *testing.B) {
	router := setupBenchmark()
	
	// Create a todo first
	createBody, _ := json.Marshal(models.TodoCreate{Text: "Benchmark"})
	reqCreate, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")
	wCreate := httptest.NewRecorder()
	router.ServeHTTP(wCreate, reqCreate)
	
	var created models.Todo
	json.Unmarshal(wCreate.Body.Bytes(), &created)

	newText := "Updated"
	updateBody, _ := json.Marshal(models.TodoUpdate{Text: &newText})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("PUT", "/api/todos/"+created.ID, bytes.NewBuffer(updateBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkToggleTodo(b *testing.B) {
	router := setupBenchmark()
	
	// Create a todo first
	createBody, _ := json.Marshal(models.TodoCreate{Text: "Benchmark"})
	reqCreate, _ := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")
	wCreate := httptest.NewRecorder()
	router.ServeHTTP(wCreate, reqCreate)
	
	var created models.Todo
	json.Unmarshal(wCreate.Body.Bytes(), &created)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("PATCH", "/api/todos/"+created.ID+"/toggle", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkGetStats(b *testing.B) {
	router := setupBenchmark()
	req, _ := http.NewRequest("GET", "/api/todos/stats/summary", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkGetByTag(b *testing.B) {
	router := setupBenchmark()
	req, _ := http.NewRequest("GET", "/api/todos/tags/work", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkBulkComplete(b *testing.B) {
	router := setupBenchmark()
	
	bulkBody, _ := json.Marshal(models.BulkOperation{
		IDs:       []string{"123", "456", "789"},
		Operation: "complete",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/todos/bulk", bytes.NewBuffer(bulkBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkExportTodos(b *testing.B) {
	router := setupBenchmark()
	req, _ := http.NewRequest("GET", "/api/export/todos", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkGetAllTodosWithFilter(b *testing.B) {
	router := setupBenchmark()
	req, _ := http.NewRequest("GET", "/api/todos?filter=active&priority=high", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}

func BenchmarkJSONSerialization(b *testing.B) {
	todo := models.Todo{
		ID:        "bench-123",
		Text:      "Benchmark Todo",
		Priority:  models.PriorityHigh,
		Completed: false,
		Tags:      []string{"tag1", "tag2", "tag3"},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		json.Marshal(todo)
	}
}

func BenchmarkJSONDeserialization(b *testing.B) {
	jsonData := []byte(`{
		"text": "Benchmark",
		"priority": "high",
		"completed": false,
		"tags": ["tag1", "tag2"]
	}`)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var todo models.TodoCreate
		json.Unmarshal(jsonData, &todo)
	}
}




