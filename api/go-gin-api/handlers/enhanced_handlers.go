package handlers

import (
	"net/http"
	"spicytodo-go-api/models"

	"github.com/gin-gonic/gin"
)

// Snooze a todo
func (h *TodoHandler) SnoozeTodo(c *gin.Context) {
	id := c.Param("id")

	var input models.SnoozeRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	todo, exists := h.service.Snooze(id, input.Until)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// Unsnooze a todo
func (h *TodoHandler) UnsnoozeTodo(c *gin.Context) {
	id := c.Param("id")

	todo, exists := h.service.Unsnooze(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// GetUpcomingReminders returns todos with upcoming reminders
func (h *TodoHandler) GetUpcomingReminders(c *gin.Context) {
	reminders := h.service.GetUpcomingReminders()
	c.JSON(http.StatusOK, reminders)
}

// GetByTag returns todos with a specific tag
func (h *TodoHandler) GetByTag(c *gin.Context) {
	tag := c.Param("tag")
	todos := h.service.GetByTag(tag)
	c.JSON(http.StatusOK, todos)
}

// GetByCategory returns todos in a specific category
func (h *TodoHandler) GetByCategory(c *gin.Context) {
	category := c.Param("category")
	todos := h.service.GetByCategory(category)
	c.JSON(http.StatusOK, todos)
}

// GetAllTags returns all unique tags
func (h *TodoHandler) GetAllTags(c *gin.Context) {
	tags := h.service.GetAllTags()
	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

// GetAllCategories returns all unique categories
func (h *TodoHandler) GetAllCategories(c *gin.Context) {
	categories := h.service.GetAllCategories()
	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// BulkOperation handles bulk operations on todos
func (h *TodoHandler) BulkOperation(c *gin.Context) {
	var input models.BulkOperation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var affected int

	switch input.Operation {
	case "delete":
		affected = h.service.BulkDelete(input.IDs)
		
	case "complete":
		affected = h.service.BulkComplete(input.IDs, true)
		
	case "uncomplete":
		affected = h.service.BulkComplete(input.IDs, false)
		
	case "updatePriority":
		if priorityStr, ok := input.Data["priority"].(string); ok {
			priority := models.Priority(priorityStr)
			affected = h.service.BulkUpdatePriority(input.IDs, priority)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Priority required for updatePriority operation"})
			return
		}
		
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid operation. Valid: delete, complete, uncomplete, updatePriority"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk operation completed",
		"affected": affected,
	})
}

// ExportTodos exports todos in JSON format
func (h *TodoHandler) ExportTodos(c *gin.Context) {
	var query models.ExportQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		query.Format = "json"
		query.Filter = "all"
	}

	if query.Format == "" {
		query.Format = "json"
	}
	if query.Filter == "" {
		query.Filter = "all"
	}

	result := h.service.ExportTodos(query.Filter)

	// Set download headers
	filename := "todos_" + query.Filter + "_" + result.ExportedAt[:10] + ".json"
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")

	c.JSON(http.StatusOK, result)
}

// ImportTodos imports todos from JSON
func (h *TodoHandler) ImportTodos(c *gin.Context) {
	var input models.ImportRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default mode
	if input.Mode == "" {
		input.Mode = "append"
	}

	// Validate mode
	validModes := []string{"replace", "append"}
	isValidMode := false
	for _, mode := range validModes {
		if input.Mode == mode {
			isValidMode = true
			break
		}
	}

	if !isValidMode {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode. Valid modes: replace, append"})
		return
	}

	result := h.service.ImportTodos(input.Todos, input.Mode)
	c.JSON(http.StatusOK, result)
}

