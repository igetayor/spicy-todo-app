package handlers

import (
	"net/http"
	"spicytodo-go-api/models"
	"spicytodo-go-api/service"

	"github.com/gin-gonic/gin"
)

type TodoHandler struct {
	service *service.TodoService
}

func NewTodoHandler(service *service.TodoService) *TodoHandler {
	return &TodoHandler{
		service: service,
	}
}

func (h *TodoHandler) GetRoot(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "🌶️ Spicy Todo API - Go/Gin Implementation",
		"version": "1.0.0",
		"docs":    "/api/todos",
	})
}

func (h *TodoHandler) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "spicy-todo-go-api",
		"uptime":  "running",
	})
}

func (h *TodoHandler) GetTodos(c *gin.Context) {
	filter := c.Query("filter")
	search := c.Query("search")
	priority := c.Query("priority")

	todos := h.service.GetAll(filter, search, priority)
	c.JSON(http.StatusOK, todos)
}

func (h *TodoHandler) CreateTodo(c *gin.Context) {
	var input models.TodoCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	todo := h.service.Create(input)
	c.JSON(http.StatusCreated, todo)
}

func (h *TodoHandler) GetTodoByID(c *gin.Context) {
	id := c.Param("id")
	todo, exists := h.service.GetByID(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}
	c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) UpdateTodo(c *gin.Context) {
	id := c.Param("id")

	var input models.TodoUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	todo, exists := h.service.Update(id, input)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) DeleteTodo(c *gin.Context) {
	id := c.Param("id")

	if !h.service.Delete(id) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todo deleted successfully"})
}

func (h *TodoHandler) ToggleTodo(c *gin.Context) {
	id := c.Param("id")

	todo, exists := h.service.Toggle(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

func (h *TodoHandler) GetStats(c *gin.Context) {
	stats := h.service.GetStats()
	c.JSON(http.StatusOK, stats)
}

func (h *TodoHandler) ClearCompleted(c *gin.Context) {
	h.service.ClearCompleted()
	c.JSON(http.StatusOK, gin.H{"message": "Completed todos cleared"})
}

