package models

import (
	"time"
	"gorm.io/gorm"
)

// Admin 管理员
type Admin struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Username    string    `json:"username" gorm:"uniqueIndex;not null"`
	Email       string    `json:"email" gorm:"uniqueIndex;not null"`
	Password    string    `json:"-" gorm:"not null"`

	// 角色权限
	Role        string    `json:"role" gorm:"default:moderator"` // super_admin/admin/moderator
	Permissions StringArray `json:"permissions" gorm:"type:text[]"` // 权限列表

	// 个人信息
	Avatar      string    `json:"avatar"`
	Phone       string    `json:"phone"`
	Department  string    `json:"department"`

	// 状态
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	LastLoginAt *time.Time `json:"last_login_at"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// AdminLog 管理员操作日志
type AdminLog struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AdminID     string    `json:"admin_id" gorm:"type:uuid;index;not null"`

	// 操作信息
	Action      string    `json:"action" gorm:"index"` // create/update/delete/approve/reject
	Module      string    `json:"module" gorm:"index"` // user/question/library/ad
	TargetType  string    `json:"target_type"` // 操作对象类型
	TargetID    string    `json:"target_id" gorm:"type:uuid;index"` // 操作对象ID

	// 详情
	Description string    `json:"description" gorm:"type:text"`
	Changes     string    `json:"changes" gorm:"type:json"` // 变更内容JSON

	// IP和设备
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`

	CreatedAt   time.Time `json:"created_at"`

	Admin       Admin     `json:"admin,omitempty" gorm:"foreignKey:AdminID"`
}

// QuestionReview 题目审核记录
type QuestionReview struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	QuestionID  string    `json:"question_id" gorm:"type:uuid;index;not null"`
	ReviewerID  string    `json:"reviewer_id" gorm:"type:uuid;index;not null"` // 审核管理员ID

	// 审核结果
	Status      string    `json:"status" gorm:"index"` // pending/approved/rejected
	Reason      string    `json:"reason" gorm:"type:text"` // 审核意见

	// 质量评分
	QualityScore int      `json:"quality_score"` // 1-5
	Difficulty   int      `json:"difficulty"` // 1-5

	ReviewedAt  time.Time `json:"reviewed_at"`
	CreatedAt   time.Time `json:"created_at"`

	Question    Question  `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
	Reviewer    Admin     `json:"reviewer,omitempty" gorm:"foreignKey:ReviewerID"`
}

// UserReport 用户举报
type UserReport struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ReporterID  string    `json:"reporter_id" gorm:"type:uuid;index;not null"` // 举报人
	TargetType  string    `json:"target_type" gorm:"index"` // user/post/comment/question
	TargetID    string    `json:"target_id" gorm:"type:uuid;index;not null"`

	// 举报信息
	Reason      string    `json:"reason" gorm:"not null"` // spam/inappropriate/offensive/other
	Description string    `json:"description" gorm:"type:text"`
	Evidence    StringArray `json:"evidence" gorm:"type:text[]"` // 截图URL等

	// 处理状态
	Status      string    `json:"status" gorm:"index;default:pending"` // pending/reviewing/resolved/dismissed
	HandlerID   string    `json:"handler_id" gorm:"type:uuid;index"` // 处理人
	HandleNote  string    `json:"handle_note" gorm:"type:text"`
	HandledAt   *time.Time `json:"handled_at"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Reporter    User      `json:"reporter,omitempty" gorm:"foreignKey:ReporterID"`
	Handler     Admin     `json:"handler,omitempty" gorm:"foreignKey:HandlerID"`
}

// SystemConfig 系统配置
type SystemConfig struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Key         string    `json:"key" gorm:"uniqueIndex;not null"`
	Value       string    `json:"value" gorm:"type:text"`
	ValueType   string    `json:"value_type"` // string/number/boolean/json
	Category    string    `json:"category" gorm:"index"` // general/email/push/payment/ad
	Description string    `json:"description" gorm:"type:text"`
	IsPublic    bool      `json:"is_public" gorm:"default:false"` // 是否对外公开
	UpdatedBy   string    `json:"updated_by" gorm:"type:uuid"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedAt   time.Time `json:"created_at"`
}

// 管理员角色常量
const (
	AdminRoleSuperAdmin = "super_admin"
	AdminRoleAdmin      = "admin"
	AdminRoleModerator  = "moderator"
)

// 权限常量
const (
	PermissionUserManage     = "user:manage"
	PermissionQuestionReview = "question:review"
	PermissionLibraryManage  = "library:manage"
	PermissionAdManage       = "ad:manage"
	PermissionSystemConfig   = "system:config"
	PermissionViewLogs       = "logs:view"
)

// 审核状态常量
const (
	ReviewStatusPending  = "pending"
	ReviewStatusApproved = "approved"
	ReviewStatusRejected = "rejected"
)

// 举报状态常量
const (
	ReportStatusPending   = "pending"
	ReportStatusReviewing = "reviewing"
	ReportStatusResolved  = "resolved"
	ReportStatusDismissed = "dismissed"
)
