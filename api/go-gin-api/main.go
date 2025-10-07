package main

import (
	"log"
	"os"
	"spicytodo-go-api/handlers"
	"spicytodo-go-api/routes"
	"spicytodo-go-api/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize service
	todoService := service.NewTodoService()

	// Initialize handler
	todoHandler := handlers.NewTodoHandler(todoService)

	// Setup router
	router := gin.Default()
	routes.SetupRoutes(router, todoHandler)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("🌶️  Spicy Todo API (Go/Gin) running on http://localhost:%s", port)
	
	// Start server
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
