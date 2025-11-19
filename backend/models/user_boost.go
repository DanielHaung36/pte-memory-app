package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BoostEffect 道具效果结构
type BoostEffect struct {
	Type      string    `json:"type"`        // 效果类型：xp_multiplier, accuracy_boost, time_extension, etc.
	Value     float64   `json:"value"`       // 效果数值
	Duration  int       `json:"duration"`    // 持续时间（分钟）
	ExpiresAt time.Time `json:"expires_at"`  // 过期时间
}

// UserBoost 用户激活的道具效果
type UserBoost struct {
	ID        string      `json:"id" gorm:"primaryKey"`
	UserID    string      `json:"user_id" gorm:"not null;index"`
	ItemID    string      `json:"item_id" gorm:"not null"`
	Effect    BoostEffect `json:"effect" gorm:"serializer:json"`
	IsActive  bool        `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time   `json:"created_at"`
	ExpiresAt time.Time   `json:"expires_at"`

	// Relations
	User User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Item ShopItem `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// BeforeCreate hook
func (ub *UserBoost) BeforeCreate(tx *gorm.DB) (err error) {
	if ub.ID == "" {
		ub.ID = uuid.New().String()
	}
	return
}