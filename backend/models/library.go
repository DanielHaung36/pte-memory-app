package models

import (
	"time"
	"gorm.io/gorm"
)

// QuestionLibrary 题库集合
type QuestionLibrary struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Category    string    `json:"category" gorm:"index"` // "PTE", "IELTS", "TOEFL", "General"
	SubCategory string    `json:"sub_category"` // "Speaking", "Writing", etc.

	// 题库元数据
	QuestionCount int       `json:"question_count" gorm:"default:0"`
	IsOfficial    bool      `json:"is_official" gorm:"default:false"` // 官方题库
	IsFree        bool      `json:"is_free" gorm:"default:true"` // 免费访问
	IsPublished   bool      `json:"is_published" gorm:"default:false"` // 是否发布

	// 创建者和审核
	CreatorID     string    `json:"creator_id" gorm:"type:uuid;index"`
	VerifiedBy    string    `json:"verified_by" gorm:"type:uuid"`
	VerificationStatus string `json:"verification_status" gorm:"default:pending"` // pending/approved/rejected

	// 统计数据
	Downloads     int       `json:"downloads" gorm:"default:0"`
	Views         int       `json:"views" gorm:"default:0"`
	Rating        float64   `json:"rating" gorm:"default:0"`
	RatingCount   int       `json:"rating_count" gorm:"default:0"`

	// 标签和难度
	Tags          StringArray `json:"tags" gorm:"type:text[]"`
	DifficultyLevel int      `json:"difficulty_level" gorm:"default:1"` // 1-5

	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Creator       User      `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Questions     []Question `json:"questions,omitempty" gorm:"many2many:library_questions;"`
}

// LibraryQuestion 题库-题目关联表
type LibraryQuestion struct {
	ID                 string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	LibraryID          string    `json:"library_id" gorm:"type:uuid;index;not null"`
	QuestionID         string    `json:"question_id" gorm:"type:uuid;index;not null"`
	OrderIndex         int       `json:"order_index" gorm:"default:0"` // 题目顺序
	IsRequired         bool      `json:"is_required" gorm:"default:true"` // 是否必做
	CreatedAt          time.Time `json:"created_at"`

	Library            QuestionLibrary `json:"library,omitempty" gorm:"foreignKey:LibraryID"`
	Question           Question        `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
}

// UserLibrary 用户下载的题库
type UserLibrary struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID         string    `json:"user_id" gorm:"type:uuid;index;not null"`
	LibraryID      string    `json:"library_id" gorm:"type:uuid;index;not null"`
	Progress       int       `json:"progress" gorm:"default:0"` // 完成进度百分比
	CompletedCount int       `json:"completed_count" gorm:"default:0"` // 已完成题数
	CorrectCount   int       `json:"correct_count" gorm:"default:0"` // 正确题数
	LastStudyDate  *time.Time `json:"last_study_date"`
	IsFavorite     bool      `json:"is_favorite" gorm:"default:false"`
	Rating         int       `json:"rating"` // 用户评分 1-5
	DownloadedAt   time.Time `json:"downloaded_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	User           User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Library        QuestionLibrary `json:"library,omitempty" gorm:"foreignKey:LibraryID"`
}

// ReferralCode 推荐码系统
type ReferralCode struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID         string    `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	Code           string    `json:"code" gorm:"uniqueIndex;not null"` // 唯一推荐码
	UsageCount     int       `json:"usage_count" gorm:"default:0"` // 使用次数
	TotalRewards   int       `json:"total_rewards" gorm:"default:0"` // 累计获得积分
	IsActive       bool      `json:"is_active" gorm:"default:true"`
	ExpiresAt      *time.Time `json:"expires_at"` // 过期时间（可选）
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	User           User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ReferralUsage 推荐码使用记录
type ReferralUsage struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ReferralCodeID string    `json:"referral_code_id" gorm:"type:uuid;index;not null"`
	ReferrerID     string    `json:"referrer_id" gorm:"type:uuid;index;not null"` // 推荐人
	ReferredUserID string    `json:"referred_user_id" gorm:"type:uuid;index;not null"` // 被推荐人
	ReferrerReward int       `json:"referrer_reward" gorm:"default:0"` // 推荐人奖励
	ReferredReward int       `json:"referred_reward" gorm:"default:0"` // 被推荐人奖励
	Status         string    `json:"status" gorm:"default:pending"` // pending/completed/expired
	CompletedAt    *time.Time `json:"completed_at"`
	CreatedAt      time.Time `json:"created_at"`

	ReferralCode   ReferralCode `json:"referral_code,omitempty" gorm:"foreignKey:ReferralCodeID"`
	Referrer       User         `json:"referrer,omitempty" gorm:"foreignKey:ReferrerID"`
	ReferredUser   User         `json:"referred_user,omitempty" gorm:"foreignKey:ReferredUserID"`
}

// LibraryRating 题库评分记录
type LibraryRating struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `json:"user_id" gorm:"type:uuid;index;not null"`
	LibraryID string    `json:"library_id" gorm:"type:uuid;index;not null"`
	Rating    int       `json:"rating" gorm:"not null"` // 1-5星
	Review    string    `json:"review" gorm:"type:text"` // 评价文字
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User      User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Library   QuestionLibrary `json:"library,omitempty" gorm:"foreignKey:LibraryID"`
}
