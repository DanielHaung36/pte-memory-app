package models

import (
	"time"
	"gorm.io/gorm"
)

// GameSession represents a game session record
type GameSession struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           string    `json:"user_id" gorm:"type:uuid;not null;index"`
	GameType         string    `json:"game_type" gorm:"not null"`
	Score            int       `json:"score" gorm:"default:0"`
	QuestionsAnswered int      `json:"questions_answered" gorm:"default:0"`
	CorrectAnswers   int       `json:"correct_answers" gorm:"default:0"`
	TimeSpent        int       `json:"time_spent" gorm:"default:0"` // in seconds
	ComboCount       int       `json:"combo_count" gorm:"default:0"`
	StartTime        time.Time `json:"start_time"`
	EndTime          *time.Time `json:"end_time,omitempty"`
	IsCompleted      bool      `json:"is_completed" gorm:"default:false"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	
	// Associations
	User             User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Achievement represents user achievements
type Achievement struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"user_id" gorm:"not null;index"`
	AchievementType string `json:"achievement_type" gorm:"not null"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Progress    int       `json:"progress" gorm:"default:0"`
	Target      int       `json:"target" gorm:"default:1"`
	IsUnlocked  bool      `json:"is_unlocked" gorm:"default:false"`
	UnlockedAt  *time.Time `json:"unlocked_at,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GetRecentGameSessions retrieves recent game sessions for a user
func GetRecentGameSessions(db *gorm.DB, userID string, limit int) ([]GameSession, error) {
	var sessions []GameSession
	err := db.Where("user_id = ? AND is_completed = true", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&sessions).Error
	return sessions, err
}

// GetUserAchievements retrieves achievements for a user
func GetUserAchievements(db *gorm.DB, userID string) ([]Achievement, error) {
	var achievements []Achievement
	err := db.Where("user_id = ?", userID).
		Order("created_at ASC").
		Find(&achievements).Error
	return achievements, err
}

// CreateGameSession creates a new game session
func CreateGameSession(db *gorm.DB, session *GameSession) error {
	return db.Create(session).Error
}

// UpdateGameSession updates a game session
func UpdateGameSession(db *gorm.DB, sessionID string, updates map[string]interface{}) error {
	return db.Model(&GameSession{}).Where("id = ?", sessionID).Updates(updates).Error
}