package routes

import (
	"pte-memory-backend/controllers"
	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/websocket"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, wsHub *websocket.Hub) {
	// Initialize controllers
	authController := &controllers.AuthController{}
	userController := &controllers.UserController{}
	questionController := controllers.NewQuestionController(wsHub)
	wrongQuestionController := controllers.NewWrongQuestionController(wsHub)
	gameController := &controllers.GameController{}
	socialController := controllers.NewSocialController()
	shopController := &controllers.ShopController{}
	uploadController := &controllers.UploadController{}
	importController := &controllers.ImportController{}
	commentController := controllers.NewCommentController()
	pteModuleController := controllers.NewPTEModuleController()
	
	// API group with global rate limiter
	api := router.Group("/api")
	api.Use(middleware.GlobalRateLimiter())

	// Auth routes (public) with strict rate limiting
	auth := api.Group("/auth")
	auth.Use(middleware.AuthRateLimiter())
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
		users.GET("/stats", userController.GetStats)
		users.GET("/progress", userController.GetProgress)
		users.GET("/settings", userController.GetSettings)
		users.PUT("/settings", userController.UpdateSettings)
	}
	
	// Review routes
	reviews := api.Group("/reviews")
	reviews.Use(middleware.AuthMiddleware())
	{
		reviews.GET("/due", questionController.GetDueQuestions)
		reviews.GET("/history", questionController.GetReviewHistory)
		reviews.GET("/stats", questionController.GetQuestionStatistics)
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
	
	// Wrong Question routes - 错题管理路由
	wrongQuestions := api.Group("/wrong-questions")
	wrongQuestions.Use(middleware.AuthMiddleware())
	{
		wrongQuestions.POST("", wrongQuestionController.CreateWrongQuestion)
		wrongQuestions.GET("", wrongQuestionController.GetWrongQuestions)
		wrongQuestions.GET("/stats", wrongQuestionController.GetWrongQuestionStats)
		wrongQuestions.GET("/search", wrongQuestionController.SearchWrongQuestions)
		wrongQuestions.POST("/batch", wrongQuestionController.BatchUpdateWrongQuestions)
		wrongQuestions.GET("/:id", wrongQuestionController.GetWrongQuestion)
		wrongQuestions.PUT("/:id", wrongQuestionController.UpdateWrongQuestion)
		wrongQuestions.DELETE("/:id", wrongQuestionController.DeleteWrongQuestion)
	}

	// Comment routes - 评论系统路由
	comments := api.Group("/comments")
	{
		// 公开路由 - 查看评论
		comments.GET("/question/:question_id", commentController.GetCommentsByQuestion)
		comments.GET("/:id", commentController.GetComment)

		// 需要认证的路由
		commentsProtected := comments.Use(middleware.AuthMiddleware())
		{
			commentsProtected.POST("", commentController.CreateComment)
			commentsProtected.GET("/my", commentController.GetMyComments)
			commentsProtected.PUT("/:id", commentController.UpdateComment)
			commentsProtected.DELETE("/:id", commentController.DeleteComment)
			commentsProtected.POST("/:id/like", commentController.LikeComment)
			commentsProtected.DELETE("/:id/like", commentController.UnlikeComment)
			commentsProtected.POST("/:id/pin", commentController.PinComment)
		}
	}

	// PTE Module routes - PTE模块系统路由
	pteModules := api.Group("/pte")
	{
		// 公开路由 - 查看模块和题型
		pteModules.GET("/modules", pteModuleController.GetAllModules)
		pteModules.GET("/modules/by-code/:code", pteModuleController.GetModuleByCode)
		pteModules.GET("/modules/:module_id/types", pteModuleController.GetQuestionTypesByModule)
		pteModules.GET("/types/:code", pteModuleController.GetQuestionTypeByCode)

		// 需要认证的路由
		pteProtected := pteModules.Use(middleware.AuthMiddleware())
		{
			// 统计数据
			pteProtected.GET("/stats/overview", pteModuleController.GetModuleOverview)
			pteProtected.GET("/stats/module/:module_id", pteModuleController.GetUserModuleStats)
			pteProtected.GET("/stats/modules", pteModuleController.GetUserAllModuleStats)
			pteProtected.GET("/stats/type/:question_type_id", pteModuleController.GetUserQuestionTypeStats)

			// 题目管理
			pteProtected.GET("/questions/:type_code", pteModuleController.GetQuestionsByType)

			// 练习和考试
			pteProtected.POST("/practice/start", pteModuleController.StartPracticeSession)
			pteProtected.POST("/practice/submit", pteModuleController.SubmitPracticeAnswer)
		}
	}

	// Analytics routes
	analyticsController := controllers.NewAnalyticsController(wsHub)
	analytics := api.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware())
	{
		analytics.GET("/dashboard", analyticsController.GetDashboardStats)
		analytics.GET("/trends", analyticsController.GetLearningTrends)
		analytics.GET("/heatmap", analyticsController.GetReviewHeatmap)
		analytics.GET("/comparison", analyticsController.GetPerformanceComparison)
		analytics.GET("/pattern", analyticsController.GetStudyPattern)
		analytics.GET("/achievements", analyticsController.GetAchievementProgress)
		analytics.GET("/insights", analyticsController.GetPersonalizedInsights)
		analytics.GET("/export", analyticsController.ExportAnalyticsData)
	}
	
	// Knowledge Graph routes - REMOVED (feature not needed)
	// kg := api.Group("/knowledge")
	// kg.Use(middleware.AuthMiddleware())
	// { ... }

	// Social/Community routes
	social := api.Group("/social")
	{
		// Public routes (no auth required)
		social.GET("/feed/public", socialController.GetPublicFeed)
		
		// Protected routes
		socialProtected := social.Use(middleware.AuthMiddleware())
		{
			// Posts
			socialProtected.POST("/posts", socialController.CreatePost)
			socialProtected.GET("/feed", socialController.GetFeed)
			socialProtected.GET("/posts/user/:userId", socialController.GetUserPosts)
			socialProtected.POST("/posts/:postId/like", socialController.LikePost)
			socialProtected.POST("/posts/:postId/bookmark", socialController.BookmarkPost)
			socialProtected.GET("/bookmarks", socialController.GetBookmarks)
			
			// Comments
			socialProtected.POST("/posts/:postId/comments", socialController.CreateComment)
			socialProtected.GET("/posts/:postId/comments", socialController.GetComments)
			socialProtected.POST("/posts/:postId/comments/:commentId/like", socialController.LikeComment)
			socialProtected.POST("/posts/:postId/comments/:commentId/dislike", socialController.DislikeComment)

			// Following
			socialProtected.POST("/users/:userId/follow", socialController.FollowUser)
			socialProtected.GET("/users/:userId/follow-stats", socialController.GetFollowStats)
		}
	}
	
	// Shop/Store routes
	shop := api.Group("/shop")
	{
		// Public routes
		shop.GET("/items", shopController.GetShopItems)

		// Protected routes
		shopProtected := shop.Use(middleware.AuthMiddleware())
		{
			// Inventory
			shopProtected.GET("/inventory", shopController.GetUserInventory)
			shopProtected.GET("/theme", shopController.GetUserTheme)
			shopProtected.PUT("/theme", shopController.UpdateUserTheme)

			// Purchase
			shopProtected.POST("/purchase/:itemId", shopController.PurchaseItem)
			shopProtected.POST("/use/:itemId", shopController.UseItem)
			shopProtected.GET("/history", shopController.GetPurchaseHistory)
		}
	}

	// Exam Practice routes - PTE/IELTS专项练习
	exams := api.Group("/exams")
	{
		// Public routes
		exams.GET("/public/practice", controllers.GetPublicPracticeQuestions)
		exams.GET("/question-types", controllers.GetQuestionTypes)

		// Protected routes
		examsProtected := exams.Use(middleware.AuthMiddleware())
		{
			// PTE Practice
			examsProtected.GET("/pte/practice", controllers.GetPTEPracticeQuestions)

			// IELTS Practice
			examsProtected.GET("/ielts/practice", controllers.GetIELTSPracticeQuestions)

			// Mock Test
			examsProtected.POST("/mock-test/start", controllers.StartMockTest)

			// Exam Sessions - 考试会话管理
			examsProtected.GET("/sessions", controllers.GetExamSessions)
			examsProtected.GET("/sessions/:id", controllers.GetExamSessionDetail)
			examsProtected.POST("/sessions/:id/pause", controllers.PauseExamSession)
			examsProtected.POST("/sessions/:id/resume", controllers.ResumeExamSession)
			examsProtected.POST("/sessions/:id/submit-answer", controllers.SubmitAnswer)
			examsProtected.POST("/sessions/:id/complete", controllers.CompleteExamSession)
			examsProtected.GET("/sessions/:id/report", controllers.GetExamReport)

			// Statistics
			examsProtected.GET("/statistics", controllers.GetExamStatistics)

			// Question interaction
			examsProtected.POST("/questions/:id/like", controllers.LikeQuestion)
		}
	}

	// Library routes - 题库管理
	library := api.Group("/library")
	{
		// Public routes
		library.GET("/public", controllers.GetPublicLibraries)
		library.GET("/:id", controllers.GetLibraryDetail)

		// Protected routes
		libraryProtected := library.Use(middleware.AuthMiddleware())
		{
			// Library management
			libraryProtected.POST("", controllers.CreateLibrary)
			libraryProtected.GET("/my", controllers.GetMyLibraries)
			libraryProtected.POST("/:id/download", controllers.DownloadLibrary)
			libraryProtected.POST("/:id/rate", controllers.RateLibrary)
		}
	}

	// Question contribution
	questionsContrib := api.Group("/questions")
	questionsContrib.Use(middleware.AuthMiddleware())
	{
		questionsContrib.POST("/contribute", controllers.ContributeQuestion)
	}

	// Referral system - 推荐码系统
	referral := api.Group("/referral")
	referral.Use(middleware.AuthMiddleware())
	{
		referral.GET("/code", controllers.GetReferralCode)
		referral.POST("/redeem", controllers.RedeemReferralCode)
	}

	// Reminder/Notification routes - 提醒和通知
	reminders := api.Group("/reminders")
	reminders.Use(middleware.AuthMiddleware())
	{
		reminders.GET("/settings", controllers.GetReminderSettings)
		reminders.PUT("/settings", controllers.UpdateReminderSettings)
	}

	notifications := api.Group("/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		notifications.GET("", controllers.GetNotifications)
		notifications.GET("/unread-count", controllers.GetUnreadCount)
		notifications.GET("/type/:type", controllers.GetNotificationsByType)
		notifications.PUT("/:id/read", controllers.MarkNotificationRead)
		notifications.PUT("/read-all", controllers.MarkAllNotificationsRead)
		notifications.DELETE("/:id", controllers.DeleteNotification)
		notifications.DELETE("/clear", controllers.ClearAllNotifications)
		notifications.POST("/test", controllers.TestNotification) // 测试用
	}

	// Chat routes - 聊天系统
	chatController := controllers.NewChatController(wsHub)
	chat := api.Group("/chat")
	{
		// 聊天室路由（需认证）
		chatProtected := chat.Use(middleware.AuthMiddleware())
		{
			// 聊天室
			chatProtected.GET("/rooms/level", chatController.GetLevelChatRooms)
			chatProtected.POST("/rooms/:id/join", chatController.JoinChatRoom)
			chatProtected.POST("/rooms/:id/leave", chatController.LeaveChatRoom)
			chatProtected.GET("/rooms/:id/messages", chatController.GetChatMessages)
			chatProtected.POST("/rooms/:id/messages", chatController.SendChatMessage)

			// 私聊
			chatProtected.GET("/private", chatController.GetPrivateChats)
			chatProtected.POST("/private/start", chatController.StartPrivateChat)
			chatProtected.GET("/private/:chatId/messages", chatController.GetPrivateMessages)
			chatProtected.POST("/private/:chatId/messages", chatController.SendPrivateMessage)
		}
	}

	// Study Group routes - 学习小组
	studyGroups := api.Group("/study-groups")
	{
		// 公开路由
		studyGroups.GET("", controllers.GetStudyGroups)
		studyGroups.GET("/:id", controllers.GetStudyGroup)
		studyGroups.GET("/:id/posts", controllers.GetStudyGroupPosts)

		// 需要认证的路由
		studyGroupsProtected := studyGroups.Use(middleware.AuthMiddleware())
		{
			studyGroupsProtected.POST("", controllers.CreateStudyGroup)
			studyGroupsProtected.GET("/my", controllers.GetMyStudyGroups)
			studyGroupsProtected.POST("/:id/join", controllers.JoinStudyGroup)
			studyGroupsProtected.POST("/:id/leave", controllers.LeaveStudyGroup)
			studyGroupsProtected.PUT("/:id", controllers.UpdateStudyGroup)
			studyGroupsProtected.DELETE("/:id", controllers.DeleteStudyGroup)
			studyGroupsProtected.POST("/:id/posts", controllers.CreateStudyGroupPost)
		}
	}

	// Advertising routes - 广告系统
	ads := api.Group("/ads")
	{
		// 公开路由
		ads.GET("", controllers.GetAdvertisements)

		// 需要认证的路由
		adsProtected := ads.Use(middleware.AuthMiddleware())
		{
			adsProtected.POST("/:id/view", controllers.RecordAdView)
			adsProtected.POST("/:id/reward", controllers.ClaimAdReward)
			adsProtected.GET("/quota", controllers.GetAdQuota)
		}
	}

	// Upload routes - 文件上传 (需要认证)
	upload := api.Group("/upload")
	upload.Use(middleware.AuthMiddleware())
	{
		upload.POST("/avatar", uploadController.UploadAvatar)
		upload.POST("/audio", uploadController.UploadQuestionAudio)
		upload.POST("/image", uploadController.UploadQuestionImage)
		upload.DELETE("/:fileId", uploadController.DeleteFile)
	}

	// Import routes - 批量导入 (需要认证)
	importRoutes := api.Group("/import")
	importRoutes.Use(middleware.AuthMiddleware())
	{
		// 题目导入
		importRoutes.POST("/questions/preview", importController.PreviewQuestionsImport)
		importRoutes.POST("/questions/execute", importController.ExecuteQuestionsImport)
		importRoutes.GET("/template/questions", importController.DownloadQuestionTemplate)

		// 错题导入
		importRoutes.POST("/wrong-questions/preview", importController.PreviewWrongQuestionsImport)
		importRoutes.POST("/wrong-questions/execute", importController.ExecuteWrongQuestionsImport)
		importRoutes.GET("/template/wrong-questions", importController.DownloadWrongQuestionTemplate)

		// 批量上传音频
		importRoutes.POST("/audio/batch", importController.BatchUploadAudio)
	}

	// Push Notification routes - 推送通知
	push := api.Group("/push")
	push.Use(middleware.AuthMiddleware())
	{
		// 设备管理
		push.POST("/register", controllers.RegisterDeviceToken)
		push.POST("/unregister", controllers.UnregisterDeviceToken)
		push.GET("/devices", controllers.GetUserDevices)

		// 推送设置
		push.GET("/settings", controllers.GetPushSettings)
		push.PUT("/settings", controllers.UpdatePushSettings)

		// 推送历史
		push.GET("/history", controllers.GetPushHistory)

		// 测试推送
		push.POST("/test", controllers.SendTestPush)
	}

	// Admin routes - 管理后台（需要管理员认证）
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware(database.DB))
	{
		// 统计概览
		admin.GET("/stats", controllers.GetAdminStats)

		// 用户管理
		admin.GET("/users", controllers.GetAllUsers)
		admin.GET("/users/:id", controllers.GetUserDetail)
		admin.POST("/users/:id/ban", controllers.BanUser)
		admin.POST("/users/:id/unban", controllers.UnbanUser)
		admin.PUT("/users/:id/role", controllers.UpdateUserRole)

		// 题目审核
		admin.GET("/questions/pending", controllers.GetPendingQuestions)
		admin.POST("/questions/:id/approve", controllers.ApproveQuestion)
		admin.POST("/questions/:id/reject", controllers.RejectQuestion)
		admin.POST("/questions/batch-review", controllers.BatchReviewQuestions)

		// 举报处理
		admin.GET("/reports", controllers.GetUserReports)
		admin.POST("/reports/:id/process", controllers.ProcessReport)

		// 系统配置
		admin.GET("/configs", controllers.GetSystemConfigs)
		admin.POST("/configs", controllers.CreateSystemConfig)
		admin.PUT("/configs/:key", controllers.UpdateSystemConfig)

		// 操作日志
		admin.GET("/logs", controllers.GetAdminLogs)

		// 广告管理
		admin.POST("/ads", controllers.CreateAdvertisement)
		admin.PUT("/ads/:id", controllers.UpdateAdvertisement)
		admin.GET("/ads/:id/stats", controllers.GetAdStatistics)

		// 推送通知管理
		admin.POST("/push/broadcast", controllers.SendBroadcastPush)
		admin.GET("/push/templates", controllers.GetPushTemplates)
		admin.POST("/push/templates", controllers.CreatePushTemplate)
		admin.PUT("/push/templates/:id", controllers.UpdatePushTemplate)
		admin.GET("/push/stats", controllers.GetPushStats)
	}
}