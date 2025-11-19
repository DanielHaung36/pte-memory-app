package models

import (
	"time"
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
)

// UserRole represents user role
type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type User struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Avatar    string    `json:"avatar"`
	Level     int       `json:"level" gorm:"default:1"`
	XP        int       `json:"xp" gorm:"default:0"`
	Streak    int       `json:"streak" gorm:"default:0"`
	BestStreak int      `json:"best_streak" gorm:"default:0"`
	Role      string    `json:"role" gorm:"type:varchar(20);default:'user';index"`

	// Ban related fields
	IsBanned   bool       `json:"is_banned" gorm:"default:false;index"`
	BanReason  string     `json:"ban_reason,omitempty"`
	BanUntil   *time.Time `json:"ban_until,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Questions     []Question     `json:"questions,omitempty"`
	ReviewSessions []ReviewSession `json:"review_sessions,omitempty"`
	UserStats     *UserStats     `json:"user_stats,omitempty"`
}

// IsAdmin checks if the user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == string(RoleAdmin)
}

type UserStats struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           string    `json:"user_id" gorm:"type:uuid;not null;uniqueIndex"`
	TotalQuestions   int       `json:"total_questions" gorm:"default:0"`
	ReviewedCount    int       `json:"reviewed_count" gorm:"default:0"`
	CorrectCount     int       `json:"correct_count" gorm:"default:0"`
	WrongCount       int       `json:"wrong_count" gorm:"default:0"`
	AccuracyRate     float64   `json:"accuracy_rate" gorm:"default:0"`
	DailyGoal        int       `json:"daily_goal" gorm:"default:20"`
	StudyDays        int       `json:"study_days" gorm:"default:0"`
	CurrentStreak    int       `json:"current_streak" gorm:"default:0"`
	LongestStreak    int       `json:"longest_streak" gorm:"default:0"`
	LastStudyDate    *time.Time `json:"last_study_date"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Statistics by question type
	SpeakingStats  QuestionTypeStats `json:"speaking_stats" gorm:"embedded;embeddedPrefix:speaking_"`
	WritingStats   QuestionTypeStats `json:"writing_stats" gorm:"embedded;embeddedPrefix:writing_"`
	ReadingStats   QuestionTypeStats `json:"reading_stats" gorm:"embedded;embeddedPrefix:reading_"`
	ListeningStats QuestionTypeStats `json:"listening_stats" gorm:"embedded;embeddedPrefix:listening_"`

	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

type QuestionTypeStats struct {
	Total     int     `json:"total" gorm:"default:0"`
	Correct   int     `json:"correct" gorm:"default:0"`
	Wrong     int     `json:"wrong" gorm:"default:0"`
	Accuracy  float64 `json:"accuracy" gorm:"default:0"`
}

// HashPassword hashes the user's password
func (u *User) HashPassword(password string) error {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedBytes)
	return nil
}

// CheckPassword checks if the provided password matches the user's password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// UpdateLevel calculates and updates user level based on XP
func (u *User) UpdateLevel() {
	// Level calculation: every 1000 XP = 1 level
	newLevel := (u.XP / 1000) + 1
	if newLevel != u.Level {
		u.Level = newLevel
	}
}

// AddXP adds experience points and updates level
func (u *User) AddXP(points int) {
	u.XP += points
	u.UpdateLevel()
}

// UpdateStreak updates the user's streak
func (u *User) UpdateStreak(isCorrect bool) {
	if isCorrect {
		u.Streak++
		if u.Streak > u.BestStreak {
			u.BestStreak = u.Streak
		}
	} else {
		u.Streak = 0
	}
}