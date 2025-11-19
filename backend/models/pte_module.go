package models

import (
	"time"
	"gorm.io/gorm"
)

// PTEModule PTE考试模块
type PTEModule struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Code        string    `json:"code" gorm:"uniqueIndex;not null"` // 模块代码，如 "speaking", "writing"
	Name        string    `json:"name" gorm:"not null"` // 模块名称，如 "Speaking"
	NameCN      string    `json:"name_cn"` // 中文名称，如 "口语"
	Description string    `json:"description" gorm:"type:text"` // 模块描述
	IconURL     string    `json:"icon_url"` // 模块图标
	Color       string    `json:"color"` // 主题颜色
	SortOrder   int       `json:"sort_order" gorm:"default:0"` // 排序
	IsActive    bool      `json:"is_active" gorm:"default:true"` // 是否启用
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联（使用 gorm:"-" 跳过自动迁移，手动处理关联）
	QuestionTypes []PTEQuestionType `json:"question_types,omitempty" gorm:"-"`
}

// PTEQuestionType PTE题型
type PTEQuestionType struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ModuleID          string    `json:"module_id" gorm:"type:uuid;not null;index"`
	Code              string    `json:"code" gorm:"uniqueIndex;not null"` // 题型代码，如 "read_aloud"
	Name              string    `json:"name" gorm:"not null"` // 题型名称，如 "Read Aloud"
	NameCN            string    `json:"name_cn"` // 中文名称，如 "朗读"
	Description       string    `json:"description" gorm:"type:text"` // 题型描述
	ScoringInfo       string    `json:"scoring_info" gorm:"type:text"` // 评分信息
	TimeLimit         int       `json:"time_limit"` // 平均时间限制（秒）
	QuestionCount     int       `json:"question_count"` // 考试中的题目数量
	TotalQuestions    int       `json:"total_questions" gorm:"default:0"` // 题库中的题目总数

	// 考试权重和技巧
	ScoreWeight       string    `json:"score_weight"` // 分数权重，如 "Oral Fluency, Pronunciation"
	SkillsTested      StringArray `json:"skills_tested" gorm:"type:text[]"` // 测试的技能
	Tips              StringArray `json:"tips" gorm:"type:text[]"` // 做题技巧
	CommonMistakes    StringArray `json:"common_mistakes" gorm:"type:text[]"` // 常见错误

	// UI相关
	IconURL           string    `json:"icon_url"` // 题型图标
	Color             string    `json:"color"` // 主题颜色
	SampleQuestionID  string    `json:"sample_question_id" gorm:"type:uuid"` // 示例题目ID
	VideoTutorialURL  string    `json:"video_tutorial_url"` // 视频教程链接

	SortOrder         int       `json:"sort_order" gorm:"default:0"` // 排序
	IsActive          bool      `json:"is_active" gorm:"default:true"` // 是否启用
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	// 关联（使用 gorm:"-" 跳过自动迁移）
	Module            PTEModule `json:"module,omitempty" gorm:"-"`
}

// PTEModuleStats 用户在各模块的统计数据
type PTEModuleStats struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_user_module"`
	ModuleID          string    `json:"module_id" gorm:"type:uuid;not null;uniqueIndex:idx_user_module"`

	TotalQuestions    int       `json:"total_questions" gorm:"default:0"` // 总题数
	CompletedQuestions int      `json:"completed_questions" gorm:"default:0"` // 已完成题数
	CorrectAnswers    int       `json:"correct_answers" gorm:"default:0"` // 正确答案数
	AccuracyRate      float64   `json:"accuracy_rate" gorm:"default:0"` // 准确率
	AverageScore      float64   `json:"average_score" gorm:"default:0"` // 平均分
	TotalTimeSpent    int       `json:"total_time_spent" gorm:"default:0"` // 总学习时间（秒）
	LastPracticeDate  *time.Time `json:"last_practice_date"` // 最后练习日期
	MasteryLevel      int       `json:"mastery_level" gorm:"default:0"` // 掌握程度 0-100

	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	// 关联（使用 gorm:"-" 跳过自动迁移）
	User              User      `json:"user,omitempty" gorm:"-"`
	Module            PTEModule `json:"module,omitempty" gorm:"-"`
}

// PTEQuestionTypeStats 用户在各题型的统计数据
type PTEQuestionTypeStats struct {
	ID                string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID            string    `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_user_type"`
	QuestionTypeID    string    `json:"question_type_id" gorm:"type:uuid;not null;uniqueIndex:idx_user_type"`

	TotalAttempts     int       `json:"total_attempts" gorm:"default:0"` // 总尝试次数
	CorrectAttempts   int       `json:"correct_attempts" gorm:"default:0"` // 正确次数
	AccuracyRate      float64   `json:"accuracy_rate" gorm:"default:0"` // 准确率
	AverageTime       int       `json:"average_time" gorm:"default:0"` // 平均用时（秒）
	BestScore         float64   `json:"best_score" gorm:"default:0"` // 最好成绩
	RecentScore       float64   `json:"recent_score" gorm:"default:0"` // 最近成绩
	ProgressRate      float64   `json:"progress_rate" gorm:"default:0"` // 进步率
	LastPracticeDate  *time.Time `json:"last_practice_date"` // 最后练习日期
	MasteryLevel      int       `json:"mastery_level" gorm:"default:0"` // 掌握程度 0-100

	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	// 关联（使用 gorm:"-" 跳过自动迁移）
	User              User             `json:"user,omitempty" gorm:"-"`
	QuestionType      PTEQuestionType  `json:"question_type,omitempty" gorm:"-"`
}

// GetAllModules 获取所有PTE模块
func GetAllModules(db *gorm.DB) ([]PTEModule, error) {
	var modules []PTEModule
	err := db.Preload("QuestionTypes").
		Where("is_active = ?", true).
		Order("sort_order ASC, created_at ASC").
		Find(&modules).Error
	return modules, err
}

// GetModuleByCode 根据代码获取模块
func GetModuleByCode(db *gorm.DB, code string) (*PTEModule, error) {
	var module PTEModule
	err := db.Preload("QuestionTypes").
		Where("code = ? AND is_active = ?", code, true).
		First(&module).Error
	return &module, err
}

// GetQuestionTypesByModule 获取模块下的所有题型
func GetQuestionTypesByModule(db *gorm.DB, moduleID string) ([]PTEQuestionType, error) {
	var questionTypes []PTEQuestionType
	err := db.Where("module_id = ? AND is_active = ?", moduleID, true).
		Order("sort_order ASC, created_at ASC").
		Find(&questionTypes).Error
	return questionTypes, err
}

// GetQuestionTypeByCode 根据代码获取题型
func GetQuestionTypeByCode(db *gorm.DB, code string) (*PTEQuestionType, error) {
	var questionType PTEQuestionType
	err := db.Preload("Module").
		Where("code = ? AND is_active = ?", code, true).
		First(&questionType).Error
	return &questionType, err
}

// GetUserModuleStats 获取用户的模块统计
func GetUserModuleStats(db *gorm.DB, userID string, moduleID string) (*PTEModuleStats, error) {
	var stats PTEModuleStats
	err := db.Where("user_id = ? AND module_id = ?", userID, moduleID).
		First(&stats).Error

	if err == gorm.ErrRecordNotFound {
		// 如果不存在，创建新记录
		stats = PTEModuleStats{
			UserID:   userID,
			ModuleID: moduleID,
		}
		db.Create(&stats)
		return &stats, nil
	}

	return &stats, err
}

// GetUserQuestionTypeStats 获取用户的题型统计
func GetUserQuestionTypeStats(db *gorm.DB, userID string, questionTypeID string) (*PTEQuestionTypeStats, error) {
	var stats PTEQuestionTypeStats
	err := db.Where("user_id = ? AND question_type_id = ?", userID, questionTypeID).
		First(&stats).Error

	if err == gorm.ErrRecordNotFound {
		// 如果不存在，创建新记录
		stats = PTEQuestionTypeStats{
			UserID:         userID,
			QuestionTypeID: questionTypeID,
		}
		db.Create(&stats)
		return &stats, nil
	}

	return &stats, err
}

// UpdateModuleStats 更新模块统计数据
func (s *PTEModuleStats) UpdateStats(db *gorm.DB, isCorrect bool, timeSpent int) error {
	s.TotalQuestions++
	s.CompletedQuestions++

	if isCorrect {
		s.CorrectAnswers++
	}

	if s.CompletedQuestions > 0 {
		s.AccuracyRate = float64(s.CorrectAnswers) / float64(s.CompletedQuestions) * 100
	}

	s.TotalTimeSpent += timeSpent
	now := time.Now()
	s.LastPracticeDate = &now

	// 计算掌握程度（基于准确率和完成度）
	completionRate := float64(s.CompletedQuestions) / float64(s.TotalQuestions) * 100
	s.MasteryLevel = int((s.AccuracyRate*0.7 + completionRate*0.3))

	return db.Save(s).Error
}

// UpdateQuestionTypeStats 更新题型统计数据
func (s *PTEQuestionTypeStats) UpdateStats(db *gorm.DB, isCorrect bool, timeSpent int, score float64) error {
	s.TotalAttempts++

	if isCorrect {
		s.CorrectAttempts++
	}

	if s.TotalAttempts > 0 {
		s.AccuracyRate = float64(s.CorrectAttempts) / float64(s.TotalAttempts) * 100
	}

	// 更新平均时间
	if s.AverageTime == 0 {
		s.AverageTime = timeSpent
	} else {
		s.AverageTime = (s.AverageTime + timeSpent) / 2
	}

	// 更新最好成绩
	if score > s.BestScore {
		s.BestScore = score
	}

	// 计算进步率
	if s.RecentScore > 0 {
		s.ProgressRate = ((score - s.RecentScore) / s.RecentScore) * 100
	}
	s.RecentScore = score

	now := time.Now()
	s.LastPracticeDate = &now

	// 计算掌握程度
	s.MasteryLevel = int(s.AccuracyRate*0.6 + (float64(s.TotalAttempts)/10)*0.4)
	if s.MasteryLevel > 100 {
		s.MasteryLevel = 100
	}

	return db.Save(s).Error
}
