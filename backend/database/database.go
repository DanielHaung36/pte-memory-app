package database

import (
	"fmt"
	"log"
	"pte-memory-backend/config"
	"pte-memory-backend/models"
	
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
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
		log.Printf("Failed to connect to PostgreSQL: %v", err)
		log.Println("Falling back to SQLite database...")
		
		// Fallback to SQLite
		DB, err = gorm.Open(sqlite.Open("pte_memory.db"), gormConfig)
		if err != nil {
			log.Fatalf("Failed to connect to SQLite database: %v", err)
		}
		log.Println("SQLite database connected successfully")
	} else {
		// Enable UUID extension for PostgreSQL
		DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
		log.Println("PostgreSQL database connected successfully")
	}

	// Run migrations
	migrate()
}

func migrate() {
	log.Println("Running database migrations...")
	
	// Drop GameSession table if exists to fix foreign key constraint issue
	DB.Exec("DROP TABLE IF EXISTS game_sessions CASCADE")
	log.Println("Dropped game_sessions table to fix foreign key constraints")
	
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
		// Knowledge Graph Models
		&models.KnowledgeNode{},
		&models.KnowledgeEdge{},
		&models.UserKnowledgeProgress{},
		&models.LearningPath{},
		&models.QuestionKnowledgeNode{},
	)
	
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Create indexes for better performance
	createIndexes()
	
	// Seed initial data for testing
	seedTestData()
	
	log.Println("Database migrations completed successfully")
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
	
	// Knowledge Graph indexes
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_category ON knowledge_nodes (category)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes (node_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_level ON knowledge_nodes (level)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges (from_node_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges (to_node_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON knowledge_edges (edge_type)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_user ON user_knowledge_progress (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_node ON user_knowledge_progress (node_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_user_knowledge_progress_mastery ON user_knowledge_progress (mastery_level)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths (user_id)")
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON learning_paths (is_active)")
	
	log.Println("Database indexes created successfully")
}

func seedTestData() {
	// 检查是否已经有测试用户存在
	var count int64
	DB.Model(&models.User{}).Where("id = ?", "00000000-0000-0000-0000-000000000001").Count(&count)
	if count > 0 {
		log.Println("Test data already exists, skipping seed")
		return
	}

	log.Println("Seeding test data...")
	
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
		log.Printf("Failed to hash password: %v", err)
		return
	}
	
	if err := DB.Create(&testUser).Error; err != nil {
		log.Printf("Failed to create test user: %v", err)
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
			log.Printf("Failed to create test game session: %v", err)
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
			log.Printf("Failed to create test achievement: %v", err)
		}
	}
	
	log.Println("Test data seeded successfully")
}

func GetDB() *gorm.DB {
	return DB
}