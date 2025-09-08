package models

import (
	"time"
	"gorm.io/gorm"
)

type QuestionType string

const (
	Speaking  QuestionType = "speaking"
	Writing   QuestionType = "writing"
	Reading   QuestionType = "reading"
	Listening QuestionType = "listening"
)

type DifficultyLevel int

const (
	Easy       DifficultyLevel = 1
	Medium     DifficultyLevel = 2
	Hard       DifficultyLevel = 3
	VeryHard   DifficultyLevel = 4
	Expert     DifficultyLevel = 5
)

type Question struct {
	ID               string          `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           string          `json:"user_id" gorm:"type:uuid;not null;index"`
	Title            string          `json:"title" gorm:"not null"`
	Content          string          `json:"content" gorm:"type:text;not null"`
	QuestionType     QuestionType    `json:"question_type" gorm:"type:varchar(20);not null;index"`
	SubType          string          `json:"sub_type"` // e.g., "repeat_sentence", "essay", "fill_blanks"
	CorrectAnswer    string          `json:"correct_answer" gorm:"type:text"`
	UserAnswer       string          `json:"user_answer" gorm:"type:text"`
	Explanation      string          `json:"explanation" gorm:"type:text"`
	DifficultyLevel  DifficultyLevel `json:"difficulty_level" gorm:"default:1"`
	Tags             []string        `json:"tags" gorm:"type:text[]"`
	AudioURL         string          `json:"audio_url"`
	ImageURL         string          `json:"image_url"`
	TimeLimit        int             `json:"time_limit"` // in seconds
	Points           int             `json:"points" gorm:"default:10"`
	
	// Metadata
	Source           string          `json:"source"` // e.g., "PTE Official", "IELTS Cambridge"
	SourceID         string          `json:"source_id"`
	IsPublic         bool            `json:"is_public" gorm:"default:false"`
	
	// Timestamps
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        gorm.DeletedAt  `json:"-" gorm:"index"`

	// Associations
	User             User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ReviewSchedule   *ReviewSchedule `json:"review_schedule,omitempty"`
	ReviewSessions   []ReviewSession `json:"review_sessions,omitempty"`
	QuestionStats    *QuestionStats  `json:"question_stats,omitempty"`
}

type ReviewSchedule struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID             string    `json:"user_id" gorm:"type:uuid;not null;index"`
	QuestionID         string    `json:"question_id" gorm:"type:uuid;not null;uniqueIndex"`
	CurrentInterval    int       `json:"current_interval" gorm:"default:1"`    // days
	EaseFactor         float64   `json:"ease_factor" gorm:"default:2.5"`       // 1.3 - 2.5+
	RepetitionCount    int       `json:"repetition_count" gorm:"default:0"`
	NextReviewDate     time.Time `json:"next_review_date"`
	LastReviewDate     *time.Time `json:"last_review_date"`
	IsCompleted        bool      `json:"is_completed" gorm:"default:false"`
	IsMastered         bool      `json:"is_mastered" gorm:"default:false"`
	Priority           int       `json:"priority" gorm:"default:1"`           // 1-5, 5 being highest
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	// Associations
	User               User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Question           Question  `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
}

type QuestionStats struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	QuestionID         string    `json:"question_id" gorm:"type:uuid;not null;uniqueIndex"`
	TimesReviewed      int       `json:"times_reviewed" gorm:"default:0"`
	TimesCorrect       int       `json:"times_correct" gorm:"default:0"`
	TimesWrong         int       `json:"times_wrong" gorm:"default:0"`
	AccuracyRate       float64   `json:"accuracy_rate" gorm:"default:0"`
	AverageResponseTime int      `json:"average_response_time" gorm:"default:0"` // in milliseconds
	FastestResponseTime int      `json:"fastest_response_time" gorm:"default:0"`
	SlowestResponseTime int      `json:"slowest_response_time" gorm:"default:0"`
	LastCorrectDate    *time.Time `json:"last_correct_date"`
	LastWrongDate      *time.Time `json:"last_wrong_date"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`

	Question           Question  `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
}

// GetNextReviewQuestions returns questions that are due for review
func GetNextReviewQuestions(db *gorm.DB, userID string, limit int) ([]Question, error) {
	var questions []Question
	
	err := db.Preload("ReviewSchedule").
		Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
		Where("questions.user_id = ? AND rs.next_review_date <= ? AND rs.is_completed = false", 
			userID, time.Now()).
		Order("rs.priority DESC, rs.next_review_date ASC").
		Limit(limit).
		Find(&questions).Error
		
	return questions, err
}

// GetQuestionsByType returns questions filtered by type
func GetQuestionsByType(db *gorm.DB, userID string, questionType QuestionType) ([]Question, error) {
	var questions []Question
	err := db.Preload("ReviewSchedule").
		Where("user_id = ? AND question_type = ?", userID, questionType).
		Order("created_at DESC").
		Find(&questions).Error
	return questions, err
}

// GetOverdueQuestions returns questions that are overdue for review
func GetOverdueQuestions(db *gorm.DB, userID string) ([]Question, error) {
	var questions []Question
	
	err := db.Preload("ReviewSchedule").
		Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
		Where("questions.user_id = ? AND rs.next_review_date < ? AND rs.is_completed = false", 
			userID, time.Now().AddDate(0, 0, -1)).
		Order("rs.next_review_date ASC").
		Find(&questions).Error
		
	return questions, err
}