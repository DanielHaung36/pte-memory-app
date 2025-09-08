package websocket

import (
	"time"
)

// 事件类型常量
const (
	// 错题相关事件
	EventQuestionCreated  = "question_created"
	EventQuestionUpdated  = "question_updated"
	EventQuestionDeleted  = "question_deleted"
	EventQuestionReviewed = "question_reviewed"
	
	// 复习相关事件
	EventReviewSessionStarted = "review_session_started"
	EventReviewSessionEnded   = "review_session_ended"
	EventReviewProgress       = "review_progress"
	EventReviewStreak         = "review_streak_updated"
	
	// 统计相关事件
	EventStatsUpdated         = "stats_updated"
	EventLevelUp             = "level_up"
	EventAchievementUnlocked = "achievement_unlocked"
	
	// 系统事件
	EventConnected     = "connected"
	EventDisconnected  = "disconnected"
	EventError         = "error"
	EventHeartbeat     = "heartbeat"
)

// 事件数据结构

// QuestionEventData 错题事件数据
type QuestionEventData struct {
	QuestionID   string                 `json:"question_id"`
	Title        string                 `json:"title"`
	QuestionType string                 `json:"question_type"`
	Action       string                 `json:"action"` // created, updated, deleted, reviewed
	Changes      map[string]interface{} `json:"changes,omitempty"`
	ReviewResult *ReviewResult          `json:"review_result,omitempty"`
}

// ReviewResult 复习结果
type ReviewResult struct {
	IsCorrect        bool    `json:"is_correct"`
	ConfidenceLevel  int     `json:"confidence_level"`
	ResponseTime     int     `json:"response_time"` // 毫秒
	NextReviewDate   string  `json:"next_review_date"`
	CurrentInterval  int     `json:"current_interval"`
	EaseFactor       float64 `json:"ease_factor"`
	RepetitionCount  int     `json:"repetition_count"`
}

// ReviewSessionData 复习会话数据
type ReviewSessionData struct {
	SessionID       string    `json:"session_id"`
	TotalQuestions  int       `json:"total_questions"`
	CompletedCount  int       `json:"completed_count"`
	CorrectCount    int       `json:"correct_count"`
	WrongCount      int       `json:"wrong_count"`
	StartTime       time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time,omitempty"`
	Duration        int64     `json:"duration,omitempty"` // 毫秒
	AccuracyRate    float64   `json:"accuracy_rate"`
}

// StatsData 统计数据
type StatsData struct {
	TotalQuestions     int     `json:"total_questions"`
	DueQuestions       int     `json:"due_questions"`
	OverdueQuestions   int     `json:"overdue_questions"`
	MasteredQuestions  int     `json:"mastered_questions"`
	TodayReviewed      int     `json:"today_reviewed"`
	StreakDays         int     `json:"streak_days"`
	AverageAccuracy    float64 `json:"average_accuracy"`
	WeeklyProgress     int     `json:"weekly_progress"`
	MonthlyProgress    int     `json:"monthly_progress"`
	Level              int     `json:"level"`
	XP                 int     `json:"xp"`
	NextLevelXP        int     `json:"next_level_xp"`
}

// LevelUpData 升级数据
type LevelUpData struct {
	PreviousLevel int `json:"previous_level"`
	NewLevel      int `json:"new_level"`
	XPGained      int `json:"xp_gained"`
	TotalXP       int `json:"total_xp"`
	NextLevelXP   int `json:"next_level_xp"`
}

// AchievementData 成就数据
type AchievementData struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	UnlockedAt  time.Time `json:"unlocked_at"`
	XPReward    int       `json:"xp_reward"`
}

// StreakData 连击数据
type StreakData struct {
	CurrentStreak int       `json:"current_streak"`
	BestStreak    int       `json:"best_streak"`
	LastReviewDate time.Time `json:"last_review_date"`
	StreakType    string    `json:"streak_type"` // daily, correct_answers, etc.
}

// ErrorData 错误数据
type ErrorData struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// HeartbeatData 心跳数据
type HeartbeatData struct {
	Timestamp     int64 `json:"timestamp"`
	ServerTime    int64 `json:"server_time"`
	Connections   int   `json:"connections"`
	UserSessions  int   `json:"user_sessions"`
}

// 事件创建器函数

// NewQuestionEvent 创建错题事件
func NewQuestionEvent(userID string, eventType string, data QuestionEventData) Message {
	return Message{
		Type:   eventType,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewReviewSessionEvent 创建复习会话事件
func NewReviewSessionEvent(userID string, eventType string, data ReviewSessionData) Message {
	return Message{
		Type:   eventType,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewStatsEvent 创建统计事件
func NewStatsEvent(userID string, data StatsData) Message {
	return Message{
		Type:   EventStatsUpdated,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewLevelUpEvent 创建升级事件
func NewLevelUpEvent(userID string, data LevelUpData) Message {
	return Message{
		Type:   EventLevelUp,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewAchievementEvent 创建成就事件
func NewAchievementEvent(userID string, data AchievementData) Message {
	return Message{
		Type:   EventAchievementUnlocked,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewStreakEvent 创建连击事件
func NewStreakEvent(userID string, data StreakData) Message {
	return Message{
		Type:   EventReviewStreak,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewErrorEvent 创建错误事件
func NewErrorEvent(userID string, data ErrorData) Message {
	return Message{
		Type:   EventError,
		UserID: userID,
		Data:   data,
		Time:   time.Now(),
	}
}

// NewHeartbeatEvent 创建心跳事件
func NewHeartbeatEvent(data HeartbeatData) Message {
	return Message{
		Type: EventHeartbeat,
		Data: data,
		Time: time.Now(),
	}
}