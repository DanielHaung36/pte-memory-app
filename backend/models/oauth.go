package models

import (
	"time"
	"gorm.io/gorm"
)

// OAuthProvider OAuth提供商
type OAuthProvider struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`

	// 提供商信息
	Provider    string    `json:"provider" gorm:"index;not null"` // google/facebook/github/apple
	ProviderID  string    `json:"provider_id" gorm:"index;not null"` // 第三方平台的用户ID
	Email       string    `json:"email" gorm:"index"`

	// Token信息
	AccessToken  string   `json:"access_token" gorm:"type:text"`
	RefreshToken string   `json:"refresh_token" gorm:"type:text"`
	TokenExpiry  *time.Time `json:"token_expiry"`

	// 用户信息
	Avatar      string    `json:"avatar"`
	DisplayName string    `json:"display_name"`
	RawData     string    `json:"raw_data" gorm:"type:json"` // 第三方返回的原始数据

	// 时间戳
	LastLoginAt time.Time `json:"last_login_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// PasswordResetToken 密码重置token
type PasswordResetToken struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `json:"user_id" gorm:"type:uuid;index;not null"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"index;not null"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time `json:"created_at"`

	User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// OAuth提供商常量
const (
	OAuthProviderGoogle   = "google"
	OAuthProviderFacebook = "facebook"
	OAuthProviderGithub   = "github"
	OAuthProviderApple    = "apple"
)
