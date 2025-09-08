package database

import (
	"fmt"
	"log"
	"pte-memory-backend/config"
	"pte-memory-backend/models"
	
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	var err error
	
	// Create connection string
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai",
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBName,
	)

	// Configure GORM logger
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	if config.AppConfig.GinMode == "release" {
		gormConfig.Logger = logger.Default.LogMode(logger.Silent)
	}

	// Connect to database
	DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Enable UUID extension
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
	
	log.Println("Database connected successfully")

	// Run migrations
	migrate()
}

func migrate() {
	log.Println("Running database migrations...")
	
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
		&models.StreakChallenge{},
		&models.DailyGoal{},
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

func GetDB() *gorm.DB {
	return DB
}