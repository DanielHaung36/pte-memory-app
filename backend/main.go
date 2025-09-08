package main

import (
	"log"
	"net/http"
	"strings"
	
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"pte-memory-backend/config"
	"pte-memory-backend/database"
	"pte-memory-backend/routes"
	"pte-memory-backend/websocket"
)

func main() {
	// Initialize configuration
	config.Init()
	
	// Initialize database
	database.Init()
	
	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()
	
	// Set Gin mode
	gin.SetMode(config.AppConfig.GinMode)
	
	// Create Gin router
	router := gin.New()
	
	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	
	// CORS middleware - support multiple origins
	corsConfig := cors.DefaultConfig()
	
	// Split CORS_ORIGIN by comma to support multiple origins
	origins := strings.Split(config.AppConfig.CORSOrigin, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}
	
	corsConfig.AllowOrigins = origins
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))
	
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "PTE Memory App API is running",
		})
	})
	
	// Setup WebSocket routes
	router.GET("/ws", websocket.HandleWebSocket(wsHub))
	
	// Setup API routes with WebSocket hub
	routes.SetupRoutes(router, wsHub)
	
	// Start server
	port := ":" + config.AppConfig.Port
	log.Printf("Server starting on port %s", port)
	log.Printf("CORS origin: %s", config.AppConfig.CORSOrigin)
	
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}