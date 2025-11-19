package database

import (
	"fmt"
	"pte-memory-backend/config"
	appLogger "pte-memory-backend/logger"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
	"time"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	var err error
	
	// Configure GORM logger
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	if config.AppConfig.GinMode == "release" {
		gormConfig.Logger = logger.Default.LogMode(logger.Silent)
	}

	// Try PostgreSQL first
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai",
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBName,
	)

	DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		appLogger.Error("Failed to connect to PostgreSQL", zap.Error(err))
		appLogger.Warn("PostgreSQL not available, please use Docker or install PostgreSQL manually")
		appLogger.Info("Run 'docker-compose up -d' to start PostgreSQL quickly")
		appLogger.Fatal("Database connection failed. Please check QUICKSTART.md for setup instructions")
	} else {
		// Enable UUID extension for PostgreSQL
		DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
		appLogger.Info("PostgreSQL database connected successfully")
	}

	// Run migrations
	migrate()

	// Initialize services that need database access
	services.InitReminderService(DB)
	services.InitPushService(DB)
}

func migrate() {
	appLogger.Info("Running database migrations...")
	
	// Drop GameSession table if exists to fix foreign key constraint issue
	DB.Exec("DROP TABLE IF EXISTS game_sessions CASCADE")
	appLogger.Info("Dropped game_sessions table to fix foreign key constraints")
	
	// Auto migrate all models
	err := DB.AutoMigrate(
		&models.User{},
		&models.UserStats{},
		&models.Question{},
		&models.QuestionStats{},
		&models.ReviewSchedule{},
		&models.ReviewSession{},
		&models.StudySession{},
		&models.GameSession{},
		&models.Achievement{}, // 添加成就模型
		&models.StreakChallenge{},
		&models.DailyGoal{},
		&models.WrongQuestion{}, // 添加错题模型
		&models.ExamSession{}, // 添加考试会话模型
		// Comment Models - 评论系统
		&models.QuestionComment{},
		&models.CommentLike{},
		// PTE Module Models - PTE模块系统
		&models.PTEModule{},
		&models.PTEQuestionType{},
		&models.PTEModuleStats{},
		&models.PTEQuestionTypeStats{},
		// Knowledge Graph Models - REMOVED (feature not needed)
		// &models.KnowledgeNode{},
		// &models.KnowledgeEdge{},
		// &models.UserKnowledgeProgress{},
		// &models.LearningPath{},
		// &models.QuestionKnowledgeNode{},
		// Social Models
		&models.Post{},
		&models.Like{},
		&models.Dislike{}, // 添加踩功能模型
		&models.Comment{},
		&models.Share{},
		&models.Follow{},
		&models.Bookmark{},
		&models.Notification{},
		&models.StudyGroup{},
		&models.StudyGroupMember{},
		&models.StudyGroupPost{},
		&models.StudyGroupComment{},
		// Shop Models
		&models.ShopItem{},
		&models.UserInventory{},
		&models.PurchaseHistory{},
		&models.UserTheme{},
		&services.UserBoost{},
		// Library Models - 题库系统
		&models.QuestionLibrary{},
		&models.LibraryQuestion{},
		&models.UserLibrary{},
		&models.LibraryRating{},
		// Referral Models - 推荐码系统
		&models.ReferralCode{},
		&models.ReferralUsage{},
		// Reminder Models - 提醒系统
		&models.ReminderSettings{},
		&models.ScheduledReminder{},
		&models.NotificationTemplate{},
		// Chat Models - 聊天系统
		&models.ChatRoom{},
		&models.ChatRoomMember{},
		&models.ChatMessage{},
		&models.ChatMessageLike{},
		&models.PrivateChat{},
		&models.PrivateMessage{},
		// Advertising Models - 广告系统
		&models.Advertisement{},
		&models.AdView{},
		&models.AdReward{},
		&models.UserAdQuota{},
		// Push Notification Models - 推送通知
		&models.DeviceToken{},
		&models.PushNotification{},
		&models.PushTemplate{},
		// Admin Models - 管理系统
		&models.Admin{},
		&models.AdminLog{},
		&models.QuestionReview{},
		&models.UserReport{},
		&models.SystemConfig{},
		// OAuth Models - 第三方登录
		&models.OAuthProvider{},
		&models.PasswordResetToken{},
	)

	if err != nil {
		appLogger.Fatal("Failed to migrate database", zap.Error(err))
	}

	// Create indexes for better performance
	createIndexes()
	
	// Seed initial data for testing
	seedTestData()

	// Seed shop items
	seedShopItems()

	// Seed push templates
	seedPushTemplates()

	// Seed PTE modules
	if err := SeedPTEModules(DB); err != nil {
		appLogger.Error("Failed to seed PTE modules", zap.Error(err))
	} else {
		appLogger.Info("PTE modules seeded successfully")
	}

	appLogger.Info("Database migrations completed successfully")
}

func createIndexes() {
	// User indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)")
	
	// Question indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_user_type ON questions (user_id, question_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions (created_at DESC)")
	
	// Review schedule indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_review_schedules_next_review ON review_schedules (next_review_date)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_review_schedules_user_priority ON review_schedules (user_id, priority DESC)")
	
	// Review session indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_review_sessions_user_date ON review_sessions (user_id, reviewed_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_review_sessions_session_id ON review_sessions (session_id)")
	
	// Daily goal indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals (user_id, date DESC)")
	
	// Wrong question indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_id ON wrong_questions (question_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_error_type ON wrong_questions (error_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_resolved ON wrong_questions (is_resolved)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_priority ON wrong_questions (priority DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions (created_at DESC)")

	// Knowledge Graph indexes - REMOVED (feature not needed)
	// DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_category ON knowledge_nodes (category)")
	// ... other knowledge graph indexes ...

	// Social indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts (user_id, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_posts_type_created ON posts (post_type, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_posts_privacy_created ON posts (privacy, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes (user_id, post_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_likes_post_created ON likes (post_id, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments (post_id, created_at ASC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_comments_user_created ON comments (user_id, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_study_groups_category ON study_groups (category)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_study_groups_privacy ON study_groups (privacy)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members (group_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members (user_id)")
	
	// Shop indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items (category)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items (rarity)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items (is_active)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_shop_items_price ON shop_items (price)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_inventory_item ON user_inventory (item_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_inventory_active ON user_inventory (is_active)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON purchase_history (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_purchase_history_created ON purchase_history (created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_themes_user ON user_themes (user_id)")

	// Library indexes - 题库索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_libraries_category ON question_libraries (category)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_libraries_creator ON question_libraries (creator_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_libraries_published ON question_libraries (is_published)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_libraries_free ON question_libraries (is_free)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_libraries_rating ON question_libraries (rating DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_library_questions_library ON library_questions (library_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_library_questions_question ON library_questions (question_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_libraries_user ON user_libraries (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_libraries_library ON user_libraries (library_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_library_ratings_library ON library_ratings (library_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_library_ratings_user ON library_ratings (user_id)")

	// Referral indexes - 推荐码索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes (code)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes (is_active)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_usages_code ON referral_usages (referral_code_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_usages_referrer ON referral_usages (referrer_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_referral_usages_referred ON referral_usages (referred_user_id)")

	// Reminder indexes - 提醒索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_user ON scheduled_reminders (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled ON scheduled_reminders (scheduled_at)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_processed ON scheduled_reminders (is_processed)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates (type)")

	// Question exam type indexes - 考试题型索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions (exam_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_sub_type ON questions (sub_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_exam_module ON questions (exam_module)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_free ON questions (is_free_question)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_questions_verification ON questions (verification_status)")

	// Exam session indexes - 考试会话索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions (status)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_type ON exam_sessions (exam_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_exam_sessions_created ON exam_sessions (created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_exam_sessions_completed ON exam_sessions (is_completed)")

	// Chat indexes - 聊天索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms (room_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_rooms_level ON chat_rooms (level)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members (room_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_private_chats_users ON private_chats (user1_id, user2_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_private_messages_chat ON private_messages (chat_id)")

	// Advertising indexes - 广告索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_advertisements_type ON advertisements (ad_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements (position)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements (is_active)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_ad_views_ad ON ad_views (ad_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_ad_views_user ON ad_views (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_ad_rewards_user ON ad_rewards (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_ad_quotas_user_date ON user_ad_quotas (user_id, date)")

	// Push notification indexes - 推送索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens (token)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_push_notifications_user ON push_notifications (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications (status)")

	// Admin indexes - 管理索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_admins_role ON admins (role)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs (admin_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs (action)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_reviews_question ON question_reviews (question_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_reports_target ON user_reports (target_type, target_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports (status)")

	// OAuth indexes - OAuth索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_oauth_providers_user ON oauth_providers (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON oauth_providers (provider, provider_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens (token)")

	// Comment indexes - 评论索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_comments_question ON question_comments (question_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_comments_user ON question_comments (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_comments_parent ON question_comments (parent_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_comments_created ON question_comments (created_at DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_question_comments_pinned ON question_comments (is_pinned DESC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes (comment_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes (user_id)")

	// PTE Module indexes - PTE模块索引
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_modules_code ON pte_modules (code)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_modules_sort ON pte_modules (sort_order ASC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_question_types_module ON pte_question_types (module_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_question_types_code ON pte_question_types (code)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_question_types_sort ON pte_question_types (sort_order ASC)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_module_stats_user_module ON pte_module_stats (user_id, module_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_pte_question_type_stats_user_type ON pte_question_type_stats (user_id, question_type_id)")

	appLogger.Info("Database indexes created successfully")
}

func seedTestData() {
	// 检查是否已经有测试用户存在
	var count int64
	DB.Model(&models.User{}).Where("id = ?", "00000000-0000-0000-0000-000000000001").Count(&count)
	if count > 0 {
		// 删除现有的复习会话记录，重新创建以确保有最新数据
		DB.Where("user_id = ?", "00000000-0000-0000-0000-000000000001").Delete(&models.ReviewSession{})
		appLogger.Info("Deleted existing review sessions, re-seeding review data...")
		
		// 跳过用户创建，直接创建复习记录
		seedReviewData()
		return
	}

	appLogger.Info("Seeding test data...")
	
	// 创建测试用户
	testUser := models.User{
		ID:       "00000000-0000-0000-0000-000000000001",
		Username: "testuser",
		Email:    "test@example.com",
		Level:    3,
		XP:       2500,
		Streak:   5,
		BestStreak: 10,
	}
	
	err := testUser.HashPassword("testpassword")
	if err != nil {
		appLogger.Error("Failed to hash password", zap.Error(err))
		return
	}
	
	if err := DB.Create(&testUser).Error; err != nil {
		appLogger.Error("Failed to create test user", zap.Error(err))
		return
	}
	
	// 创建测试游戏会话
	testSessions := []models.GameSession{
		{
			UserID:            "00000000-0000-0000-0000-000000000001",
			GameType:         "word_match",
			Score:            85,
			QuestionsAnswered: 10,
			CorrectAnswers:   8,
			TimeSpent:        120,
			ComboCount:       3,
			IsCompleted:      true,
		},
		{
			UserID:            "00000000-0000-0000-0000-000000000001",
			GameType:         "word_match",
			Score:            92,
			QuestionsAnswered: 15,
			CorrectAnswers:   14,
			TimeSpent:        180,
			ComboCount:       5,
			IsCompleted:      true,
		},
		{
			UserID:            "00000000-0000-0000-0000-000000000001",
			GameType:         "word_match", 
			Score:            78,
			QuestionsAnswered: 12,
			CorrectAnswers:   9,
			TimeSpent:        150,
			ComboCount:       2,
			IsCompleted:      true,
		},
	}
	
	for _, session := range testSessions {
		if err := DB.Create(&session).Error; err != nil {
			appLogger.Error("Failed to create test game session", zap.Error(err))
		}
	}
	
	// 创建测试成就
	testAchievements := []models.Achievement{
		{
			UserID:         "00000000-0000-0000-0000-000000000001",
			AchievementType: "first_win",
			Title:          "首场胜利",
			Description:    "完成第一场游戏",
			Icon:           "🎉",
			Progress:       1,
			Target:         1,
			IsUnlocked:     true,
		},
		{
			UserID:         "00000000-0000-0000-0000-000000000001",
			AchievementType: "streak_5",
			Title:          "连击高手",
			Description:    "连续答对5题",
			Icon:           "🔥",
			Progress:       5,
			Target:         5,
			IsUnlocked:     true,
		},
		{
			UserID:         "00000000-0000-0000-0000-000000000001",
			AchievementType: "perfect_game",
			Title:          "完美表现",
			Description:    "单场游戏100%正确率",
			Icon:           "⭐",
			Progress:       0,
			Target:         1,
			IsUnlocked:     false,
		},
	}
	
	for _, achievement := range testAchievements {
		if err := DB.Create(&achievement).Error; err != nil {
			appLogger.Error("Failed to create test achievement", zap.Error(err))
		}
	}
	
	// 创建一些问题用于复习记录
	testQuestions := []models.Question{
		{
			ID:              "q1",
			UserID:          "00000000-0000-0000-0000-000000000001",
			Title:           "Vocabulary: Abundant",
			Content:         "What is the meaning of 'abundant'?",
			QuestionType:    models.Reading,
			CorrectAnswer:   "Existing in large quantities; plentiful",
			DifficultyLevel: 3,
			Tags:           []string{"vocabulary", "adjective"},
		},
		{
			ID:              "q2",
			UserID:          "00000000-0000-0000-0000-000000000001",
			Title:           "Grammar: Past Tense",
			Content:         "What is the past tense of 'run'?",
			QuestionType:    models.Writing,
			CorrectAnswer:   "ran",
			DifficultyLevel: 2,
			Tags:           []string{"grammar", "verb"},
		},
		{
			ID:              "q3",
			UserID:          "00000000-0000-0000-0000-000000000001",
			Title:           "Vocabulary: Elaborate",
			Content:         "What does 'elaborate' mean?",
			QuestionType:    models.Reading,
			CorrectAnswer:   "Involving many carefully arranged parts; detailed and complicated",
			DifficultyLevel: 4,
			Tags:           []string{"vocabulary", "adjective"},
		},
	}
	
	for _, question := range testQuestions {
		if err := DB.Create(&question).Error; err != nil {
			appLogger.Error("Failed to create test question", zap.Error(err))
		}
	}
	
	// 同时为初次创建的用户添加复习数据
	seedReviewData()
	
	appLogger.Info("Test data seeded successfully")
}

func seedShopItems() {
	// Check if shop items already exist
	var count int64
	DB.Model(&models.ShopItem{}).Count(&count)
	if count > 0 {
		appLogger.Info("Shop items already exist, skipping seeding")
		return
	}

	appLogger.Info("Seeding shop items...")

	shopItems := []models.ShopItem{
		// Themes
		{
			ID:          "theme_dark",
			Name:        "暗夜主题",
			Description: "护眼的深色主题，适合夜间学习",
			Price:       100,
			Category:    "themes",
			ItemType:    "dark_theme",
			Rarity:      "common",
			IconURL:     "/icons/theme-dark.svg",
			ColorClass:  "from-gray-600 to-gray-900",
			IsActive:    true,
		},
		{
			ID:          "theme_sunset",
			Name:        "夕阳主题",
			Description: "温暖的橙红色主题，营造温馨氛围",
			Price:       150,
			Category:    "themes",
			ItemType:    "sunset_theme",
			Rarity:      "rare",
			IconURL:     "/icons/theme-sunset.svg",
			ColorClass:  "from-orange-400 to-red-500",
			IsActive:    true,
		},
		{
			ID:          "theme_ocean",
			Name:        "海洋主题",
			Description: "清新的蓝色主题，如深海般宁静",
			Price:       200,
			Category:    "themes",
			ItemType:    "ocean_theme",
			Rarity:      "epic",
			IconURL:     "/icons/theme-ocean.svg",
			ColorClass:  "from-blue-500 to-cyan-500",
			IsActive:    true,
		},
		
		// Avatars
		{
			ID:          "avatar_crown",
			Name:        "皇冠头像框",
			Description: "显示你的学霸地位",
			Price:       300,
			Category:    "avatars",
			ItemType:    "crown_frame",
			Rarity:      "epic",
			IconURL:     "/icons/crown.svg",
			ColorClass:  "from-yellow-400 to-yellow-600",
			IsActive:    true,
		},
		{
			ID:          "avatar_diamond",
			Name:        "钻石头像框",
			Description: "闪耀夺目的钻石边框",
			Price:       500,
			Category:    "avatars",
			ItemType:    "diamond_frame",
			Rarity:      "legendary",
			IconURL:     "/icons/diamond.svg",
			ColorClass:  "from-purple-400 to-pink-500",
			IsActive:    true,
		},
		
		// Badges
		{
			ID:          "badge_scholar",
			Name:        "学者徽章",
			Description: "证明你的学术成就",
			Price:       80,
			Category:    "badges",
			ItemType:    "scholar_badge",
			Rarity:      "common",
			IconURL:     "/icons/scholar.svg",
			ColorClass:  "from-green-400 to-blue-500",
			IsActive:    true,
		},
		{
			ID:          "badge_master",
			Name:        "大师徽章",
			Description: "学习大师专属徽章",
			Price:       250,
			Category:    "badges",
			ItemType:    "master_badge",
			Rarity:      "rare",
			IconURL:     "/icons/master.svg",
			ColorClass:  "from-yellow-500 to-orange-500",
			IsActive:    true,
		},
		
		// Boosts
		{
			ID:          "boost_double_xp",
			Name:        "双倍经验卡",
			Description: "30分钟内获得双倍经验值",
			Price:       120,
			Category:    "boosts",
			ItemType:    "double_xp",
			Rarity:      "common",
			IconURL:     "/icons/double-xp.svg",
			ColorClass:  "from-yellow-400 to-orange-500",
			IsActive:    true,
			StockCount:  -1, // Unlimited
		},
		{
			ID:          "boost_streak_save",
			Name:        "连击保护卡",
			Description: "保护你的学习连击不被中断",
			Price:       150,
			Category:    "boosts",
			ItemType:    "streak_protection",
			Rarity:      "rare",
			IconURL:     "/icons/streak-save.svg",
			ColorClass:  "from-red-400 to-pink-500",
			IsActive:    true,
			StockCount:  -1,
		},
		{
			ID:          "boost_hint_pack",
			Name:        "提示包",
			Description: "包含5个答题提示",
			Price:       80,
			Category:    "boosts",
			ItemType:    "hint_pack",
			Rarity:      "common",
			IconURL:     "/icons/hint.svg",
			ColorClass:  "from-blue-400 to-cyan-500",
			IsActive:    true,
			StockCount:  -1,
		},
		
		// Virtual Rewards
		{
			ID:          "reward_coffee",
			Name:        "虚拟咖啡",
			Description: "给自己一杯提神咖啡",
			Price:       50,
			Category:    "rewards",
			ItemType:    "virtual_coffee",
			Rarity:      "common",
			IconURL:     "/icons/coffee.svg",
			ColorClass:  "from-amber-600 to-orange-600",
			IsActive:    true,
		},
		{
			ID:          "reward_book",
			Name:        "知识宝典",
			Description: "象征知识的虚拟藏书",
			Price:       180,
			Category:    "rewards",
			ItemType:    "knowledge_book",
			Rarity:      "rare",
			IconURL:     "/icons/book.svg",
			ColorClass:  "from-indigo-500 to-purple-600",
			IsActive:    true,
		},
		{
			ID:          "reward_heart",
			Name:        "学习之心",
			Description: "对学习的热爱之心",
			Price:       300,
			Category:    "rewards",
			ItemType:    "learning_heart",
			Rarity:      "epic",
			IconURL:     "/icons/heart.svg",
			ColorClass:  "from-pink-400 to-red-500",
			IsActive:    true,
		},
	}

	for _, item := range shopItems {
		if err := DB.Create(&item).Error; err != nil {
			appLogger.Error("Error seeding shop item", zap.String("name", item.Name), zap.Error(err))
		}
	}

	appLogger.Info("Shop items seeded successfully")
}

func seedReviewData() {
	// 创建复习会话记录以生成热力图数据
	now := time.Now()
	testReviewSessions := []models.ReviewSession{
		// 过去7天的复习记录
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q1",
			IsCorrect:    true,
			ConfidenceLevel: 4,
			ReviewedAt:   now.AddDate(0, 0, -1),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q2",
			IsCorrect:    true,
			ConfidenceLevel: 3,
			ReviewedAt:   now.AddDate(0, 0, -1),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q3",
			IsCorrect:    false,
			ConfidenceLevel: 2,
			ReviewedAt:   now.AddDate(0, 0, -2),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q1",
			IsCorrect:    true,
			ConfidenceLevel: 5,
			ReviewedAt:   now.AddDate(0, 0, -3),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q2",
			IsCorrect:    true,
			ConfidenceLevel: 4,
			ReviewedAt:   now.AddDate(0, 0, -3),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q3",
			IsCorrect:    true,
			ConfidenceLevel: 3,
			ReviewedAt:   now.AddDate(0, 0, -4),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q1",
			IsCorrect:    true,
			ConfidenceLevel: 4,
			ReviewedAt:   now.AddDate(0, 0, -5),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q2",
			IsCorrect:    false,
			ConfidenceLevel: 2,
			ReviewedAt:   now.AddDate(0, 0, -6),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q3",
			IsCorrect:    true,
			ConfidenceLevel: 5,
			ReviewedAt:   now.AddDate(0, 0, -7),
		},
		// 过去几周的一些记录
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q1",
			IsCorrect:    true,
			ConfidenceLevel: 3,
			ReviewedAt:   now.AddDate(0, 0, -10),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q2",
			IsCorrect:    true,
			ConfidenceLevel: 4,
			ReviewedAt:   now.AddDate(0, 0, -12),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q3",
			IsCorrect:    false,
			ConfidenceLevel: 2,
			ReviewedAt:   now.AddDate(0, 0, -15),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q1",
			IsCorrect:    true,
			ConfidenceLevel: 5,
			ReviewedAt:   now.AddDate(0, 0, -20),
		},
		{
			UserID:       "00000000-0000-0000-0000-000000000001",
			QuestionID:   "q2",
			IsCorrect:    true,
			ConfidenceLevel: 4,
			ReviewedAt:   now.AddDate(0, 0, -25),
		},
	}
	
	for _, session := range testReviewSessions {
		if err := DB.Create(&session).Error; err != nil {
			appLogger.Error("Failed to create test review session", zap.Error(err))
		}
	}
	
	appLogger.Info("Review data seeded successfully")
}

func seedPushTemplates() {
	// Check if templates already exist
	var count int64
	DB.Model(&models.PushTemplate{}).Count(&count)
	if count > 0 {
		appLogger.Info("Push templates already exist, skipping seeding")
		return
	}

	appLogger.Info("Seeding push notification templates...")

	templates := []models.PushTemplate{
		{
			Name:          "review_reminder",
			Category:      "reminder",
			TitleTemplate: "复习提醒",
			BodyTemplate:  "你有 {{count}} 道题目到期需要复习啦！",
			TitleZhCN:     "复习提醒",
			BodyZhCN:      "你有 {{count}} 道题目到期需要复习啦！",
			TitleEn:       "Review Reminder",
			BodyEn:        "You have {{count}} questions due for review!",
			Icon:          "📚",
			IsActive:      true,
		},
		{
			Name:          "streak_reminder",
			Category:      "reminder", 
			TitleTemplate: "连击保护",
			BodyTemplate:  "你已经连续学习 {{days}} 天了！继续保持哦！",
			TitleZhCN:     "连击保护",
			BodyZhCN:      "你已经连续学习 {{days}} 天了！继续保持哦！",
			TitleEn:       "Streak Protection",
			BodyEn:        "You've maintained a {{days}}-day learning streak! Keep it up!",
			Icon:          "🔥",
			IsActive:      true,
		},
		{
			Name:          "achievement_unlocked",
			Category:      "achievement",
			TitleTemplate: "成就解锁",
			BodyTemplate:  "恭喜！你解锁了新成就：{{achievement}}",
			TitleZhCN:     "成就解锁",
			BodyZhCN:      "恭喜！你解锁了新成就：{{achievement}}",
			TitleEn:       "Achievement Unlocked",
			BodyEn:        "Congratulations! You unlocked a new achievement: {{achievement}}",
			Icon:          "🏆",
			IsActive:      true,
		},
		{
			Name:          "level_up",
			Category:      "achievement",
			TitleTemplate: "等级提升", 
			BodyTemplate:  "恭喜升级到 Level {{level}}！",
			TitleZhCN:     "等级提升",
			BodyZhCN:      "恭喜升级到 Level {{level}}！",
			TitleEn:       "Level Up",
			BodyEn:        "Congratulations! You reached Level {{level}}!",
			Icon:          "⭐",
			IsActive:      true,
		},
		{
			Name:          "daily_reminder",
			Category:      "reminder",
			TitleTemplate: "每日学习提醒",
			BodyTemplate:  "今天还没有学习哦，坚持每天练习吧！",
			TitleZhCN:     "每日学习提醒",
			BodyZhCN:      "今天还没有学习哦，坚持每天练习吧！",
			TitleEn:       "Daily Study Reminder",
			BodyEn:        "You haven't studied today. Keep up with daily practice!",
			Icon:          "⏰",
			IsActive:      true,
		},
		{
			Name:          "goal_reminder",
			Category:      "reminder",
			TitleTemplate: "目标提醒",
			BodyTemplate:  "距离今日目标还差 {{remaining}} 道题！",
			TitleZhCN:     "目标提醒",
			BodyZhCN:      "距离今日目标还差 {{remaining}} 道题！",
			TitleEn:       "Goal Reminder",
			BodyEn:        "Only {{remaining}} questions left to reach today's goal!",
			Icon:          "🎯",
			IsActive:      true,
		},
		{
			Name:          "post_liked",
			Category:      "social",
			TitleTemplate: "新的点赞",
			BodyTemplate:  "{{username}} 点赞了你的帖子",
			TitleZhCN:     "新的点赞",
			BodyZhCN:      "{{username}} 点赞了你的帖子",
			TitleEn:       "New Like",
			BodyEn:        "{{username}} liked your post",
			Icon:          "❤️",
			IsActive:      true,
		},
		{
			Name:          "post_commented",
			Category:      "social",
			TitleTemplate: "新的评论",
			BodyTemplate:  "{{username}} 评论了你的帖子：{{preview}}",
			TitleZhCN:     "新的评论",
			BodyZhCN:      "{{username}} 评论了你的帖子：{{preview}}",
			TitleEn:       "New Comment",
			BodyEn:        "{{username}} commented on your post: {{preview}}",
			Icon:          "💬",
			IsActive:      true,
		},
		{
			Name:          "user_followed",
			Category:      "social",
			TitleTemplate: "新的粉丝",
			BodyTemplate:  "{{username}} 关注了你",
			TitleZhCN:     "新的粉丝",
			BodyZhCN:      "{{username}} 关注了你",
			TitleEn:       "New Follower",
			BodyEn:        "{{username}} started following you",
			Icon:          "👤",
			IsActive:      true,
		},
		{
			Name:          "study_group_invite",
			Category:      "social",
			TitleTemplate: "小组邀请",
			BodyTemplate:  "{{username}} 邀请你加入学习小组：{{groupName}}",
			TitleZhCN:     "小组邀请",
			BodyZhCN:      "{{username}} 邀请你加入学习小组：{{groupName}}",
			TitleEn:       "Study Group Invite",
			BodyEn:        "{{username}} invited you to join study group: {{groupName}}",
			Icon:          "👥",
			IsActive:      true,
		},
	}

	for _, template := range templates {
		if err := DB.Create(&template).Error; err != nil {
			appLogger.Error("Error seeding push template", zap.String("name", template.Name), zap.Error(err))
		}
	}

	appLogger.Info("Push templates seeded successfully")
}

func GetDB() *gorm.DB {
	return DB
}