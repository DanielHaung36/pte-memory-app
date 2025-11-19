package models

import (
	"time"
)

// DeviceToken 设备推送token
type DeviceToken struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`

	// 设备信息
	Token       string    `json:"token" gorm:"uniqueIndex;not null"` // FCM/APNs token
	DeviceType  string    `json:"device_type" gorm:"index"` // ios/android/web
	DeviceName  string    `json:"device_name"`
	DeviceModel string    `json:"device_model"`
	AppVersion  string    `json:"app_version"`

	// 推送设置
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Language    string    `json:"language" gorm:"default:zh-CN"`

	// 时间戳
	LastUsedAt  time.Time `json:"last_used_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// PushNotification 推送通知记录
type PushNotification struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index"`
	TokenID     string    `json:"token_id" gorm:"type:uuid;index"` // 关联的设备token

	// 通知内容
	Title       string    `json:"title" gorm:"not null"`
	Body        string    `json:"body" gorm:"type:text;not null"`
	Icon        string    `json:"icon"`
	Sound       string    `json:"sound" gorm:"default:default"`
	Badge       int       `json:"badge"`

	// 数据payload
	Data        string    `json:"data" gorm:"type:json"` // 额外数据，JSON格式
	ActionURL   string    `json:"action_url"` // 点击跳转URL
	Category    string    `json:"category"` // reminder/achievement/social/system

	// 发送状态
	Status      string    `json:"status" gorm:"index"` // pending/sent/failed/clicked
	SentAt      *time.Time `json:"sent_at"`
	FailReason  string    `json:"fail_reason" gorm:"type:text"`

	// Firebase/APNs 响应
	MessageID   string    `json:"message_id"` // FCM/APNs返回的消息ID

	CreatedAt   time.Time `json:"created_at"`

	User        User        `json:"user,omitempty" gorm:"foreignKey:UserID"`
	DeviceToken DeviceToken `json:"device_token,omitempty" gorm:"foreignKey:TokenID"`
}

// PushTemplate 推送模板
type PushTemplate struct {
	ID            string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name          string    `json:"name" gorm:"uniqueIndex;not null"`
	Category      string    `json:"category" gorm:"index"` // reminder/achievement/social

	// 模板内容（支持变量）
	TitleTemplate string    `json:"title_template" gorm:"not null"`
	BodyTemplate  string    `json:"body_template" gorm:"type:text;not null"`
	Icon          string    `json:"icon"`
	Sound         string    `json:"sound" gorm:"default:default"`

	// 多语言支持
	TitleZhCN     string    `json:"title_zh_cn"`
	BodyZhCN      string    `json:"body_zh_cn" gorm:"type:text"`
	TitleEn       string    `json:"title_en"`
	BodyEn        string    `json:"body_en" gorm:"type:text"`

	IsActive      bool      `json:"is_active" gorm:"default:true"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// 推送状态常量
const (
	PushStatusPending = "pending"
	PushStatusSent    = "sent"
	PushStatusFailed  = "failed"
	PushStatusClicked = "clicked"
)

// 设备类型常量
const (
	DeviceTypeIOS     = "ios"
	DeviceTypeAndroid = "android"
	DeviceTypeWeb     = "web"
)
