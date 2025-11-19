package models

import (
	"time"
	"gorm.io/gorm"
)

// ReminderSettings 用户提醒设置
type ReminderSettings struct {
	ID                    string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID                string    `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`

	// 每日学习提醒
	EnableDailyReminder   bool      `json:"enable_daily_reminder" gorm:"default:true"`
	DailyReminderTime     string    `json:"daily_reminder_time" gorm:"default:09:00"` // HH:MM 格式
	DailyReminderDays     StringArray `json:"daily_reminder_days" gorm:"type:text[]"` // ["Monday", "Tuesday", ...]

	// 复习到期提醒
	EnableReviewReminder  bool      `json:"enable_review_reminder" gorm:"default:true"`
	ReviewAdvanceHours    int       `json:"review_advance_hours" gorm:"default:2"` // 提前几小时提醒
	ReviewReminderTime    string    `json:"review_reminder_time" gorm:"default:19:00"` // 固定提醒时间

	// 连击保护提醒
	EnableStreakReminder  bool      `json:"enable_streak_reminder" gorm:"default:true"`
	StreakReminderTime    string    `json:"streak_reminder_time" gorm:"default:20:00"` // 每天提醒时间

	// 学习目标提醒
	EnableGoalReminder    bool      `json:"enable_goal_reminder" gorm:"default:true"`
	GoalCheckTime         string    `json:"goal_check_time" gorm:"default:21:00"` // 检查目标完成情况

	// 通知渠道
	EnableWebPush         bool      `json:"enable_web_push" gorm:"default:true"` // 网页推送
	EnableEmail           bool      `json:"enable_email" gorm:"default:false"` // 邮件提醒
	EnableSound           bool      `json:"enable_sound" gorm:"default:true"` // 声音提醒

	// 免打扰时段
	DoNotDisturbStart     string    `json:"do_not_disturb_start"` // HH:MM
	DoNotDisturbEnd       string    `json:"do_not_disturb_end"`   // HH:MM
	EnableDoNotDisturb    bool      `json:"enable_do_not_disturb" gorm:"default:false"`

	// 时区设置
	Timezone              string    `json:"timezone" gorm:"default:Asia/Shanghai"`

	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`

	User                  User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// Notification 系统通知记录
type Notification struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `json:"user_id" gorm:"type:uuid;index;not null"`

	// 通知类型
	Type      string    `json:"type" gorm:"index"` // daily/review_due/streak_risk/goal_incomplete/achievement
	Category  string    `json:"category"` // reminder/achievement/social/system

	// 通知内容
	Title     string    `json:"title" gorm:"not null"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	ActionURL string    `json:"action_url"` // 点击后跳转链接
	IconURL   string    `json:"icon_url"` // 图标URL

	// 相关数据
	RelatedID   string  `json:"related_id" gorm:"type:uuid"` // 关联的问题/题库/成就ID
	RelatedType string  `json:"related_type"` // question/library/achievement
	Priority    int     `json:"priority" gorm:"default:1"` // 1-5，5最高

	// 状态
	IsRead    bool      `json:"is_read" gorm:"default:false;index"`
	ReadAt    *time.Time `json:"read_at"`
	IsSent    bool      `json:"is_sent" gorm:"default:false"` // 是否已发送
	SentAt    *time.Time `json:"sent_at"`

	// 发送渠道
	SentViaWeb   bool   `json:"sent_via_web" gorm:"default:false"`
	SentViaEmail bool   `json:"sent_via_email" gorm:"default:false"`

	ExpiresAt *time.Time       `json:"expires_at"` // 过期时间
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	DeletedAt gorm.DeletedAt   `json:"-" gorm:"index"`

	User      User             `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ScheduledReminder 定时提醒任务
type ScheduledReminder struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`
	Type        string    `json:"type" gorm:"index"` // daily/review/streak/goal
	ScheduledAt time.Time `json:"scheduled_at" gorm:"index"` // 计划发送时间
	IsProcessed bool      `json:"is_processed" gorm:"default:false;index"`
	ProcessedAt *time.Time `json:"processed_at"`
	CreatedAt   time.Time `json:"created_at"`

	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// NotificationTemplate 通知模板
type NotificationTemplate struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Type        string    `json:"type" gorm:"uniqueIndex"` // 通知类型标识
	TitleTemplate   string `json:"title_template" gorm:"not null"` // 标题模板，支持变量如 {{username}}
	MessageTemplate string `json:"message_template" gorm:"type:text;not null"` // 消息模板
	DefaultActionURL string `json:"default_action_url"` // 默认跳转链接
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// 通知类型常量
const (
	NotificationTypeDaily          = "daily_reminder"
	NotificationTypeReviewDue      = "review_due"
	NotificationTypeStreakRisk     = "streak_risk"
	NotificationTypeGoalIncomplete = "goal_incomplete"
	NotificationTypeAchievement    = "achievement_unlocked"
	NotificationTypeLevelUp        = "level_up"
	NotificationTypeSocial         = "social_interaction"
	NotificationTypeSystem         = "system_announcement"
)

// 通知分类常量
const (
	NotificationCategoryReminder    = "reminder"
	NotificationCategoryAchievement = "achievement"
	NotificationCategorySocial      = "social"
	NotificationCategorySystem      = "system"
)
