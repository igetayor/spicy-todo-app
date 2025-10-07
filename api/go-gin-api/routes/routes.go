package routes

import (
	"spicytodo-go-api/handlers"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, handler *handlers.TodoHandler) {
	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Root routes
	router.GET("/", handler.GetRoot)
	router.GET("/health", handler.GetHealth)

	// API routes
	api := router.Group("/api")
	{
		api.GET("/todos", handler.GetTodos)
		api.POST("/todos", handler.CreateTodo)
		api.GET("/todos/:id", handler.GetTodoByID)
		api.PUT("/todos/:id", handler.UpdateTodo)
		api.DELETE("/todos/:id", handler.DeleteTodo)
		api.PATCH("/todos/:id/toggle", handler.ToggleTodo)
		api.GET("/todos/stats/summary", handler.GetStats)
		api.DELETE("/todos/completed", handler.ClearCompleted)
	}
}

