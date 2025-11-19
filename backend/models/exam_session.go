package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// ExamSession 考试会话（支持暂停/继续/进度保存）
type ExamSession struct {
	ID               string         `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           string         `json:"user_id" gorm:"type:uuid;not null;index"`
	ExamType         string         `json:"exam_type" gorm:"not null;index"` // "PTE", "IELTS", "mock_test"
	ExamModule       string         `json:"exam_module"`                     // "Academic", "General Training"
	TestType         string         `json:"test_type"`                       // "Full", "Speaking", "Writing", etc

	// 会话状态
	Status           string         `json:"status" gorm:"default:'active';index"` // "active", "paused", "completed", "abandoned"
	CurrentQuestionIndex int        `json:"current_question_index" gorm:"default:0"`
	TotalQuestions   int            `json:"total_questions" gorm:"default:0"`

	// 时间管理
	StartedAt        time.Time      `json:"started_at"`
	PausedAt         *time.Time     `json:"paused_at"`
	ResumedAt        *time.Time     `json:"resumed_at"`
	CompletedAt      *time.Time     `json:"completed_at"`
	TimeSpent        int            `json:"time_spent" gorm:"default:0"`        // 总用时（秒）
	PauseDuration    int            `json:"pause_duration" gorm:"default:0"`    // 暂停总时长（秒）
	TimeLimit        int            `json:"time_limit" gorm:"default:0"`        // 考试时限（秒，0表示无限制）

	// 答题记录
	Answers          AnswerTrack    `json:"answers" gorm:"type:jsonb"`          // 答题轨迹
	QuestionIDs      StringArray    `json:"question_ids" gorm:"type:text[]"`    // 题目ID列表

	// 统计数据
	QuestionsAnswered int           `json:"questions_answered" gorm:"default:0"`
	CorrectAnswers   int            `json:"correct_answers" gorm:"default:0"`
	WrongAnswers     int            `json:"wrong_answers" gorm:"default:0"`
	SkippedQuestions int            `json:"skipped_questions" gorm:"default:0"`

	// 分项得分（四科独立）
	ScoreBreakdown   ScoreBreakdown `json:"score_breakdown" gorm:"type:jsonb"`
	TotalScore       float64        `json:"total_score" gorm:"default:0"`

	// 元数据
	Notes            string         `json:"notes" gorm:"type:text"`
	IsCompleted      bool           `json:"is_completed" gorm:"default:false"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`

	// 关联
	User             User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// AnswerTrack 答题轨迹（记录每道题的答题情况）
type AnswerTrack []AnswerRecord

type AnswerRecord struct {
	QuestionID       string    `json:"question_id"`
	QuestionType     string    `json:"question_type"`
	UserAnswer       string    `json:"user_answer"`
	CorrectAnswer    string    `json:"correct_answer"`
	IsCorrect        bool      `json:"is_correct"`
	TimeSpent        int       `json:"time_spent"`        // 答题用时（秒）
	ConfidenceLevel  int       `json:"confidence_level"`  // 1-5
	IsSkipped        bool      `json:"is_skipped"`
	AnsweredAt       time.Time `json:"answered_at"`
	Score            float64   `json:"score"`             // 本题得分
}

// ScoreBreakdown 分项得分（听说读写）
type ScoreBreakdown struct {
	Speaking  SectionScore `json:"speaking"`
	Writing   SectionScore `json:"writing"`
	Reading   SectionScore `json:"reading"`
	Listening SectionScore `json:"listening"`
	Overall   float64      `json:"overall"`
}

type SectionScore struct {
	Score            float64 `json:"score"`             // 得分
	MaxScore         float64 `json:"max_score"`         // 满分
	Percentage       float64 `json:"percentage"`        // 百分比
	QuestionsCount   int     `json:"questions_count"`   // 题目数量
	CorrectCount     int     `json:"correct_count"`     // 正确数量
	AccuracyRate     float64 `json:"accuracy_rate"`     // 正确率
}

// Value 实现 driver.Valuer 接口（JSONB 存储）
func (at AnswerTrack) Value() (driver.Value, error) {
	return json.Marshal(at)
}

// Scan 实现 sql.Scanner 接口
func (at *AnswerTrack) Scan(value interface{}) error {
	if value == nil {
		*at = AnswerTrack{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, at)
}

// Value 实现 driver.Valuer 接口
func (sb ScoreBreakdown) Value() (driver.Value, error) {
	return json.Marshal(sb)
}

// Scan 实现 sql.Scanner 接口
func (sb *ScoreBreakdown) Scan(value interface{}) error {
	if value == nil {
		*sb = ScoreBreakdown{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, sb)
}

// BeforeCreate 创建前钩子
func (es *ExamSession) BeforeCreate(tx *gorm.DB) error {
	if es.StartedAt.IsZero() {
		es.StartedAt = time.Now()
	}
	if es.Answers == nil {
		es.Answers = AnswerTrack{}
	}
	return nil
}

// Pause 暂停考试
func (es *ExamSession) Pause() {
	now := time.Now()
	es.Status = "paused"
	es.PausedAt = &now
}

// Resume 恢复考试
func (es *ExamSession) Resume() {
	now := time.Now()
	if es.PausedAt != nil {
		// 计算暂停时长
		pauseDuration := int(now.Sub(*es.PausedAt).Seconds())
		es.PauseDuration += pauseDuration
	}
	es.Status = "active"
	es.ResumedAt = &now
}

// Complete 完成考试
func (es *ExamSession) Complete() {
	now := time.Now()
	es.Status = "completed"
	es.IsCompleted = true
	es.CompletedAt = &now

	// 计算总用时（排除暂停时间）
	if !es.StartedAt.IsZero() {
		totalTime := int(now.Sub(es.StartedAt).Seconds())
		es.TimeSpent = totalTime - es.PauseDuration
	}
}

// AddAnswer 添加答题记录
func (es *ExamSession) AddAnswer(record AnswerRecord) {
	es.Answers = append(es.Answers, record)
	es.QuestionsAnswered++

	if record.IsSkipped {
		es.SkippedQuestions++
	} else if record.IsCorrect {
		es.CorrectAnswers++
	} else {
		es.WrongAnswers++
	}

	es.CurrentQuestionIndex++
}

// CalculateScores 计算分项得分
func (es *ExamSession) CalculateScores() {
	scoreBreakdown := ScoreBreakdown{}

	// 按题型分组统计
	speakingCount, speakingCorrect := 0, 0
	writingCount, writingCorrect := 0, 0
	readingCount, readingCorrect := 0, 0
	listeningCount, listeningCorrect := 0, 0

	for _, answer := range es.Answers {
		switch answer.QuestionType {
		case string(Speaking):
			speakingCount++
			if answer.IsCorrect {
				speakingCorrect++
			}
		case string(Writing):
			writingCount++
			if answer.IsCorrect {
				writingCorrect++
			}
		case string(Reading):
			readingCount++
			if answer.IsCorrect {
				readingCorrect++
			}
		case string(Listening):
			listeningCount++
			if answer.IsCorrect {
				listeningCorrect++
			}
		}
	}

	// 计算各项得分（假设满分为100）
	if speakingCount > 0 {
		scoreBreakdown.Speaking = SectionScore{
			Score:          float64(speakingCorrect) / float64(speakingCount) * 100,
			MaxScore:       100,
			Percentage:     float64(speakingCorrect) / float64(speakingCount) * 100,
			QuestionsCount: speakingCount,
			CorrectCount:   speakingCorrect,
			AccuracyRate:   float64(speakingCorrect) / float64(speakingCount) * 100,
		}
	}

	if writingCount > 0 {
		scoreBreakdown.Writing = SectionScore{
			Score:          float64(writingCorrect) / float64(writingCount) * 100,
			MaxScore:       100,
			Percentage:     float64(writingCorrect) / float64(writingCount) * 100,
			QuestionsCount: writingCount,
			CorrectCount:   writingCorrect,
			AccuracyRate:   float64(writingCorrect) / float64(writingCount) * 100,
		}
	}

	if readingCount > 0 {
		scoreBreakdown.Reading = SectionScore{
			Score:          float64(readingCorrect) / float64(readingCount) * 100,
			MaxScore:       100,
			Percentage:     float64(readingCorrect) / float64(readingCount) * 100,
			QuestionsCount: readingCount,
			CorrectCount:   readingCorrect,
			AccuracyRate:   float64(readingCorrect) / float64(readingCount) * 100,
		}
	}

	if listeningCount > 0 {
		scoreBreakdown.Listening = SectionScore{
			Score:          float64(listeningCorrect) / float64(listeningCount) * 100,
			MaxScore:       100,
			Percentage:     float64(listeningCorrect) / float64(listeningCount) * 100,
			QuestionsCount: listeningCount,
			CorrectCount:   listeningCorrect,
			AccuracyRate:   float64(listeningCorrect) / float64(listeningCount) * 100,
		}
	}

	// 计算总分（四科平均）
	totalSections := 0
	totalScore := 0.0

	if speakingCount > 0 {
		totalScore += scoreBreakdown.Speaking.Score
		totalSections++
	}
	if writingCount > 0 {
		totalScore += scoreBreakdown.Writing.Score
		totalSections++
	}
	if readingCount > 0 {
		totalScore += scoreBreakdown.Reading.Score
		totalSections++
	}
	if listeningCount > 0 {
		totalScore += scoreBreakdown.Listening.Score
		totalSections++
	}

	if totalSections > 0 {
		scoreBreakdown.Overall = totalScore / float64(totalSections)
	}

	es.ScoreBreakdown = scoreBreakdown
	es.TotalScore = scoreBreakdown.Overall
}

// GetProgress 获取考试进度
func (es *ExamSession) GetProgress() float64 {
	if es.TotalQuestions == 0 {
		return 0
	}
	return float64(es.CurrentQuestionIndex) / float64(es.TotalQuestions) * 100
}

// ExamSessionModel 数据库操作方法

// CreateExamSession 创建考试会话
func CreateExamSession(db *gorm.DB, session *ExamSession) error {
	return db.Create(session).Error
}

// GetExamSession 获取考试会话
func GetExamSession(db *gorm.DB, sessionID string) (*ExamSession, error) {
	var session ExamSession
	err := db.Preload("User").First(&session, "id = ?", sessionID).Error
	return &session, err
}

// UpdateExamSession 更新考试会话
func UpdateExamSession(db *gorm.DB, session *ExamSession) error {
	return db.Save(session).Error
}

// GetUserExamSessions 获取用户的考试会话列表
func GetUserExamSessions(db *gorm.DB, userID string, status string, limit int) ([]ExamSession, error) {
	var sessions []ExamSession
	query := db.Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("created_at DESC").Limit(limit).Find(&sessions).Error
	return sessions, err
}

// GetActiveExamSession 获取用户当前活跃的考试会话
func GetActiveExamSession(db *gorm.DB, userID string) (*ExamSession, error) {
	var session ExamSession
	err := db.Where("user_id = ? AND status IN ?", userID, []string{"active", "paused"}).
		Order("created_at DESC").
		First(&session).Error
	return &session, err
}
