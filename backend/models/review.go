package models

import (
	"time"
	"gorm.io/gorm"
)

type ReviewSession struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;index"`
	QuestionID        string    `json:"question_id" gorm:"type:uuid;not null;index"`
	IsCorrect         bool      `json:"is_correct"`
	UserAnswer        string    `json:"user_answer" gorm:"type:text"`
	ConfidenceLevel   int       `json:"confidence_level" gorm:"default:3"` // 1-5 scale
	ResponseTime      int       `json:"response_time"`                     // milliseconds
	StreakCount       int       `json:"streak_count" gorm:"default:0"`
	XPEarned          int       `json:"xp_earned" gorm:"default:0"`
	BonusXP           int       `json:"bonus_xp" gorm:"default:0"`
	ReviewedAt        time.Time `json:"reviewed_at"`
	
	// Session info
	SessionID         string    `json:"session_id"` // Group multiple questions in one session
	SessionType       string    `json:"session_type"` // "daily", "streak", "game", "custom"
	
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	// Associations
	User              User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Question          Question  `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
}

type StudySession struct {
	ID                string          `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string          `json:"user_id" gorm:"type:uuid;not null;index"`
	SessionType       string          `json:"session_type"` // "daily", "streak", "game", "custom"
	QuestionsCount    int             `json:"questions_count" gorm:"default:0"`
	CorrectCount      int             `json:"correct_count" gorm:"default:0"`
	WrongCount        int             `json:"wrong_count" gorm:"default:0"`
	AccuracyRate      float64         `json:"accuracy_rate" gorm:"default:0"`
	TotalXPEarned     int             `json:"total_xp_earned" gorm:"default:0"`
	BonusXP           int             `json:"bonus_xp" gorm:"default:0"`
	Duration          int             `json:"duration"` // seconds
	StreakAchieved    int             `json:"streak_achieved" gorm:"default:0"`
	IsCompleted       bool            `json:"is_completed" gorm:"default:false"`
	StartedAt         time.Time       `json:"started_at"`
	CompletedAt       *time.Time      `json:"completed_at"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	// Associations
	User              User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ReviewSessions    []ReviewSession `json:"review_sessions,omitempty" gorm:"-"`
}

type GameSession struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;index"`
	GameType          string    `json:"game_type"` // "word_match", "quick_select", "memory_cards"
	Score             int       `json:"score" gorm:"default:0"`
	HighScore         int       `json:"high_score" gorm:"default:0"`
	Level             int       `json:"level" gorm:"default:1"`
	QuestionsAnswered int       `json:"questions_answered" gorm:"default:0"`
	CorrectAnswers    int       `json:"correct_answers" gorm:"default:0"`
	Accuracy          float64   `json:"accuracy" gorm:"default:0"`
	Duration          int       `json:"duration"` // seconds
	XPEarned          int       `json:"xp_earned" gorm:"default:0"`
	IsCompleted       bool      `json:"is_completed" gorm:"default:false"`
	StartedAt         time.Time `json:"started_at"`
	CompletedAt       *time.Time `json:"completed_at"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	// Game-specific data
	GameData          map[string]interface{} `json:"game_data" gorm:"type:jsonb"`

	User              User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// StreakChallenge represents a streak challenge session
type StreakChallenge struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;index"`
	TargetStreak      int       `json:"target_streak" gorm:"default:10"`
	CurrentStreak     int       `json:"current_streak" gorm:"default:0"`
	BestStreak        int       `json:"best_streak" gorm:"default:0"`
	QuestionsAnswered int       `json:"questions_answered" gorm:"default:0"`
	IsActive          bool      `json:"is_active" gorm:"default:true"`
	IsCompleted       bool      `json:"is_completed" gorm:"default:false"`
	Reward            int       `json:"reward" gorm:"default:0"` // XP reward
	StartedAt         time.Time `json:"started_at"`
	CompletedAt       *time.Time `json:"completed_at"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	User              User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// DailyGoal represents user's daily learning goal
type DailyGoal struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Date              time.Time `json:"date" gorm:"type:date;uniqueIndex:idx_user_date"`
	TargetQuestions   int       `json:"target_questions" gorm:"default:20"`
	CompletedQuestions int      `json:"completed_questions" gorm:"default:0"`
	TargetXP          int       `json:"target_xp" gorm:"default:200"`
	EarnedXP          int       `json:"earned_xp" gorm:"default:0"`
	IsAchieved        bool      `json:"is_achieved" gorm:"default:false"`
	StreakCount       int       `json:"streak_count" gorm:"default:0"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	User              User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// GetTodayGoal returns today's goal for the user
func GetTodayGoal(db *gorm.DB, userID string) (*DailyGoal, error) {
	var goal DailyGoal
	today := time.Now().Truncate(24 * time.Hour)
	
	err := db.Where("user_id = ? AND date = ?", userID, today).First(&goal).Error
	if err == gorm.ErrRecordNotFound {
		// Create today's goal if it doesn't exist
		goal = DailyGoal{
			UserID:          userID,
			Date:            today,
			TargetQuestions: 20,
			TargetXP:        200,
		}
		err = db.Create(&goal).Error
	}
	
	return &goal, err
}

// UpdateProgress updates the goal progress
func (g *DailyGoal) UpdateProgress(db *gorm.DB, questionsCompleted int, xpEarned int) error {
	g.CompletedQuestions += questionsCompleted
	g.EarnedXP += xpEarned
	g.IsAchieved = g.CompletedQuestions >= g.TargetQuestions && g.EarnedXP >= g.TargetXP
	
	return db.Save(g).Error
}