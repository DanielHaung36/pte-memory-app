package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ShopItem 商店物品模型
type ShopItem struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Price       int       `json:"price" gorm:"not null"`
	Category    string    `json:"category" gorm:"not null"` // themes, avatars, badges, boosts, rewards
	ItemType    string    `json:"item_type" gorm:"not null"`
	Rarity      string    `json:"rarity" gorm:"default:common"` // common, rare, epic, legendary
	IconURL     string    `json:"icon_url"`
	ColorClass  string    `json:"color_class"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	IsLimited   bool      `json:"is_limited" gorm:"default:false"`
	StockCount  int       `json:"stock_count" gorm:"default:-1"` // -1 means unlimited
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UserInventory 用户物品库存
type UserInventory struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	UserID     string    `json:"user_id" gorm:"not null;index"`
	ItemID     string    `json:"item_id" gorm:"not null;index"`
	Quantity   int       `json:"quantity" gorm:"default:1"`
	IsActive   bool      `json:"is_active" gorm:"default:false"` // 是否正在使用
	PurchasedAt time.Time `json:"purchased_at"`
	
	// Relations
	User User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Item ShopItem `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// PurchaseHistory 购买历史
type PurchaseHistory struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"user_id" gorm:"not null;index"`
	ItemID      string    `json:"item_id" gorm:"not null;index"`
	Price       int       `json:"price" gorm:"not null"`
	Quantity    int       `json:"quantity" gorm:"default:1"`
	Status      string    `json:"status" gorm:"default:completed"` // completed, failed, refunded
	CreatedAt   time.Time `json:"created_at"`
	
	// Relations
	User User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Item ShopItem `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// UserTheme 用户主题设置
type UserTheme struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"not null;uniqueIndex"`
	ThemeID   string    `json:"theme_id"`
	AvatarID  string    `json:"avatar_id"`
	BadgeIDs  []string  `json:"badge_ids" gorm:"type:text[]"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// Relations
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// BeforeCreate hooks
func (s *ShopItem) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return
}

func (u *UserInventory) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}

func (p *PurchaseHistory) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return
}

func (u *UserTheme) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}

// Helper methods
func (s *ShopItem) IsAvailable() bool {
	return s.IsActive && (s.StockCount > 0 || s.StockCount == -1)
}

func (u *UserInventory) IsOwned() bool {
	return u.Quantity > 0
}

// GetRarityWeight 获取稀有度权重（用于排序）
func (s *ShopItem) GetRarityWeight() int {
	switch s.Rarity {
	case "legendary":
		return 4
	case "epic":
		return 3
	case "rare":
		return 2
	case "common":
		return 1
	default:
		return 0
	}
}