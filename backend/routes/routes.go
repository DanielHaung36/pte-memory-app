package routes

import (
	"github.com/gin-gonic/gin"
	"pte-memory-backend/controllers"
	"pte-memory-backend/middleware"
	"pte-memory-backend/websocket"
)

func SetupRoutes(router *gin.Engine, wsHub *websocket.Hub) {
	// Initialize controllers
	authController := &controllers.AuthController{}
	questionController := controllers.NewQuestionController(wsHub)
	gameController := &controllers.GameController{}
	
	// API group
	api := router.Group("/api")
	
	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/logout", authController.Logout)
		
		// Protected auth routes
		authProtected := auth.Use(middleware.AuthMiddleware())
		{
			authProtected.GET("/me", authController.GetMe)
			authProtected.PUT("/profile", authController.UpdateProfile)
			authProtected.POST("/refresh", middleware.RefreshToken)
		}
	}
	
	// Protected routes - use api.Group directly with middleware
	// Question routes
	questions := api.Group("/questions")
	questions.Use(middleware.AuthMiddleware())
	{
		questions.POST("", questionController.CreateQuestion)
		questions.GET("", questionController.GetQuestions)
		questions.GET("/due", questionController.GetDueQuestions)
		questions.GET("/overdue", questionController.GetOverdueQuestions)
		questions.GET("/type/:type", questionController.GetQuestionsByType)
		questions.GET("/statistics", questionController.GetQuestionStatistics)
		questions.GET("/search", questionController.SearchQuestions)
		questions.POST("/review", questionController.ReviewQuestion)
		questions.POST("/batch", questionController.BatchUpdateQuestions)
		questions.GET("/:id", questionController.GetQuestion)
		questions.PUT("/:id", questionController.UpdateQuestion)
		questions.DELETE("/:id", questionController.DeleteQuestion)
	}
	
	// User routes
	users := api.Group("/users")
	users.Use(middleware.AuthMiddleware())
	{
		// These will be implemented next
		// users.GET("/stats", userController.GetStats)
		// users.GET("/progress", userController.GetProgress)
		// users.PUT("/settings", userController.UpdateSettings)
	}
	
	// Review routes
	reviews := api.Group("/reviews")
	reviews.Use(middleware.AuthMiddleware())
	{
		reviews.GET("/history", questionController.GetReviewHistory)
		// These will be implemented next
		// reviews.POST("", reviewController.CreateReview)
		// reviews.GET("/sessions", reviewController.GetSessions)
		// reviews.POST("/sessions", reviewController.StartSession)
		// reviews.PUT("/sessions/:id", reviewController.CompleteSession)
	}
	
	// Game routes
	games := api.Group("/games")
	games.Use(middleware.AuthMiddleware())
	{
		games.GET("/stats", gameController.GetGameStats)
		games.GET("/recent", gameController.GetRecentGames)
		games.GET("/achievements", gameController.GetAchievements)
		games.GET("/words", gameController.GetWordPairs)
		games.POST("/sessions", gameController.StartGameSession)
		games.PUT("/sessions/:id", gameController.CompleteGameSession)
	}
	
	// Stats routes
	stats := api.Group("/stats")
	stats.Use(middleware.AuthMiddleware())
	{
		// These will be implemented next
		// stats.GET("/dashboard", statsController.GetDashboard)
		// stats.GET("/progress", statsController.GetProgress)
		// stats.GET("/streak", statsController.GetStreak)
	}
	
	// Knowledge Graph routes
	kg := api.Group("/knowledge")
	kg.Use(middleware.AuthMiddleware())
	{
		kg.GET("/graph", controllers.GetKnowledgeGraph)
		kg.GET("/progress", controllers.GetUserKnowledgeProgress)
		kg.PUT("/progress/:nodeId", controllers.UpdateUserKnowledgeProgress)
		kg.GET("/learning-path", controllers.GetLearningPath)
		kg.POST("/learning-path/generate", controllers.GenerateLearningPath)
		kg.GET("/recommendations", controllers.GetRecommendedQuestions)
		kg.POST("/analyze", controllers.AnalyzeQuestionKnowledge)
		kg.GET("/insights", controllers.GetKnowledgeInsights)
		kg.GET("/similar/:questionId", controllers.GetSimilarQuestions)
	}
}