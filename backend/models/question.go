package models

import (
	"database/sql/driver"
	"fmt"
	"strings"
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

// StringArray 自定义类型来处理PostgreSQL数组
type StringArray []string

// Value 实现driver.Valuer接口，用于将Go的slice转换为数据库值
func (sa StringArray) Value() (driver.Value, error) {
	if len(sa) == 0 {
		return "{}", nil
	}
	
	// 格式化为PostgreSQL数组格式 {"value1","value2"}
	var items []string
	for _, item := range sa {
		// 转义双引号并包装在双引号中
		escaped := strings.ReplaceAll(item, `"`, `\"`)
		items = append(items, fmt.Sprintf(`"%s"`, escaped))
	}
	return fmt.Sprintf("{%s}", strings.Join(items, ",")), nil
}

// Scan 实现sql.Scanner接口，用于将数据库值转换为Go类型
func (sa *StringArray) Scan(value interface{}) error {
	if value == nil {
		*sa = StringArray{}
		return nil
	}
	
	str, ok := value.(string)
	if !ok {
		return fmt.Errorf("无法将%T转换为StringArray", value)
	}
	
	// 移除大括号
	str = strings.Trim(str, "{}")
	if str == "" {
		*sa = StringArray{}
		return nil
	}
	
	// 分割并清理每个项目
	items := strings.Split(str, ",")
	result := make(StringArray, len(items))
	for i, item := range items {
		// 移除双引号并反转义
		item = strings.Trim(item, `"`)
		item = strings.ReplaceAll(item, `\"`, `"`)
		result[i] = item
	}
	
	*sa = result
	return nil
}

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

// WrongQuestion 错题记录表，专门用于管理做错的题目
type WrongQuestion struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID             string    `json:"user_id" gorm:"type:uuid;not null;index"`
	QuestionID         string    `json:"question_id" gorm:"type:uuid;not null;index"`
	UserAnswer         string    `json:"user_answer" gorm:"type:text"` // 用户的错误答案
	CorrectAnswer      string    `json:"correct_answer" gorm:"type:text"` // 正确答案
	ErrorType          string    `json:"error_type"` // 错误类型：语法、词汇、理解等
	ErrorReason        string    `json:"error_reason" gorm:"type:text"` // 错误原因分析
	Difficulty         int       `json:"difficulty" gorm:"default:1"` // 错题难度评级 1-5
	IsResolved         bool      `json:"is_resolved" gorm:"default:false"` // 是否已掌握
	ResolvedAt         *time.Time `json:"resolved_at"` // 掌握时间
	TimesWrong         int       `json:"times_wrong" gorm:"default:1"` // 错误次数
	LastWrongAt        time.Time `json:"last_wrong_at"` // 最近一次错误时间
	Notes              string    `json:"notes" gorm:"type:text"` // 用户备注
	Priority           int       `json:"priority" gorm:"default:1"` // 优先级 1-5
	Tags               StringArray  `json:"tags" gorm:"type:text[]"` // 错题标签
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联关系
	User               User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
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

// GetWrongQuestions 获取用户的错题列表
func GetWrongQuestions(db *gorm.DB, userID string, limit int, offset int) ([]WrongQuestion, error) {
	var wrongQuestions []WrongQuestion
	err := db.Preload("Question").Preload("User").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&wrongQuestions).Error
	return wrongQuestions, err
}

// GetWrongQuestionsByType 根据错误类型筛选错题
func GetWrongQuestionsByType(db *gorm.DB, userID string, errorType string) ([]WrongQuestion, error) {
	var wrongQuestions []WrongQuestion
	err := db.Preload("Question").
		Where("user_id = ? AND error_type = ?", userID, errorType).
		Order("created_at DESC").
		Find(&wrongQuestions).Error
	return wrongQuestions, err
}

// GetUnresolvedWrongQuestions 获取未解决的错题
func GetUnresolvedWrongQuestions(db *gorm.DB, userID string) ([]WrongQuestion, error) {
	var wrongQuestions []WrongQuestion
	err := db.Preload("Question").
		Where("user_id = ? AND is_resolved = false", userID).
		Order("priority DESC, created_at DESC").
		Find(&wrongQuestions).Error
	return wrongQuestions, err
}

// GetWrongQuestionStats 获取错题统计信息
func GetWrongQuestionStats(db *gorm.DB, userID string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// 总错题数
	var totalCount int64
	db.Model(&WrongQuestion{}).Where("user_id = ?", userID).Count(&totalCount)
	stats["total_wrong"] = totalCount
	
	// 未解决错题数
	var unresolvedCount int64
	db.Model(&WrongQuestion{}).Where("user_id = ? AND is_resolved = false", userID).Count(&unresolvedCount)
	stats["unresolved"] = unresolvedCount
	
	// 已解决错题数
	var resolvedCount int64
	db.Model(&WrongQuestion{}).Where("user_id = ? AND is_resolved = true", userID).Count(&resolvedCount)
	stats["resolved"] = resolvedCount
	
	// 按错误类型分组
	var typeStats []struct {
		ErrorType string `json:"error_type"`
		Count     int    `json:"count"`
	}
	db.Model(&WrongQuestion{}).
		Select("error_type, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("error_type").
		Scan(&typeStats)
	stats["by_type"] = typeStats
	
	// 按优先级分组
	var priorityStats []struct {
		Priority int `json:"priority"`
		Count    int `json:"count"`
	}
	db.Model(&WrongQuestion{}).
		Select("priority, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("priority").
		Order("priority DESC").
		Scan(&priorityStats)
	stats["by_priority"] = priorityStats
	
	return stats, nil
}