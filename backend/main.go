package main

import (
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"pte-memory-backend/cache"
	"pte-memory-backend/config"
	"pte-memory-backend/database"
	"pte-memory-backend/logger"
	"pte-memory-backend/middleware"
	"pte-memory-backend/routes"
	"pte-memory-backend/scheduler"
	"pte-memory-backend/storage"
	"pte-memory-backend/websocket"
)

func main() {
	// Initialize configuration
	config.Init()

	// Initialize logger
	if err := logger.Init(config.AppConfig.GinMode); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting PTE Memory App API", zap.String("mode", config.AppConfig.GinMode))

	// Initialize Redis cache (optional - will work without it)
	cacheConfig := cache.Config{
		Host:     config.AppConfig.RedisHost,
		Port:     config.AppConfig.RedisPort,
		Password: config.AppConfig.RedisPassword,
		DB:       config.AppConfig.RedisDB,
	}
	if err := cache.Init(cacheConfig); err != nil {
		logger.Warn("Running without Redis cache", zap.Error(err))
	}

	// Initialize database
	database.Init()

	// Initialize storage (local by default)
	storage.Init("local", map[string]string{
		"base_path": "./uploads",
		"base_url":  "http://localhost:" + config.AppConfig.Port + "/uploads",
	})

	// Initialize scheduler
	if err := scheduler.Init(); err != nil {
		logger.Fatal("Failed to initialize scheduler", zap.Error(err))
	}
	if err := scheduler.RegisterJobs(); err != nil {
		logger.Fatal("Failed to register scheduled jobs", zap.Error(err))
	}
	scheduler.Start()
	defer scheduler.Stop()

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Set Gin mode
	gin.SetMode(config.AppConfig.GinMode)

	// Create Gin router
	router := gin.New()

	// Add middleware - use custom zap logger
	router.Use(middleware.ZapLogger())
	router.Use(middleware.ZapRecovery())
	
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

	// Serve uploaded files
	router.Static("/uploads", "./uploads")

	// Setup API routes with WebSocket hub
	routes.SetupRoutes(router, wsHub)
	
	// Start server
	port := ":" + config.AppConfig.Port
	logger.Info("Server starting",
		zap.String("port", port),
		zap.String("cors_origin", config.AppConfig.CORSOrigin),
	)

	if err := router.Run(port); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}