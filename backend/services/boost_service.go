package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"pte-memory-backend/models"
)

// BoostService 处理道具增益效果的服务
type BoostService struct {
	db *gorm.DB
}

// NewBoostService 创建新的道具服务
func NewBoostService(db *gorm.DB) *BoostService {
	return &BoostService{db: db}
}

// BoostEffect 道具效果结构
type BoostEffect struct {
	Type       string    `json:"type"`        // 效果类型：xp_multiplier, accuracy_boost, time_extension, etc.
	Value      float64   `json:"value"`       // 效果数值
	Duration   int       `json:"duration"`    // 持续时间（分钟）
	ExpiresAt  time.Time `json:"expires_at"`  // 过期时间
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
	User models.User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Item models.ShopItem `json:"item,omitempty" gorm:"foreignKey:ItemID"`
}

// ApplyBoostEffect 应用道具效果
func (bs *BoostService) ApplyBoostEffect(userID, itemID string, item *models.ShopItem) (*BoostEffect, error) {
	effect := bs.getBoostEffectByItemType(item)
	if effect == nil {
		return nil, errors.New("该道具不支持增益效果")
	}

	// 创建用户增益记录
	userBoost := UserBoost{
		ID:        uuid.New().String(),
		UserID:    userID,
		ItemID:    itemID,
		Effect:    *effect,
		IsActive:  true,
		ExpiresAt: effect.ExpiresAt,
	}

	if err := bs.db.Create(&userBoost).Error; err != nil {
		return nil, err
	}

	// 根据效果类型应用不同的逻辑
	if err := bs.executeBoostEffect(userID, effect); err != nil {
		return nil, err
	}

	return effect, nil
}

// getBoostEffectByItemType 根据道具类型获取对应的效果
func (bs *BoostService) getBoostEffectByItemType(item *models.ShopItem) *BoostEffect {
	now := time.Now()

	switch item.ItemType {
	case "double_xp":
		return &BoostEffect{
			Type:      "xp_multiplier",
			Value:     2.0,
			Duration:  60, // 1小时
			ExpiresAt: now.Add(1 * time.Hour),
		}
	case "accuracy_booster":
		return &BoostEffect{
			Type:      "accuracy_boost",
			Value:     10.0, // +10%准确率加成
			Duration:  30,   // 30分钟
			ExpiresAt: now.Add(30 * time.Minute),
		}
	case "time_extender":
		return &BoostEffect{
			Type:      "time_extension",
			Value:     1.5, // 1.5倍时间
			Duration:  45,  // 45分钟
			ExpiresAt: now.Add(45 * time.Minute),
		}
	case "streak_protector":
		return &BoostEffect{
			Type:      "streak_protection",
			Value:     1.0, // 保护一次连击断开
			Duration:  120, // 2小时
			ExpiresAt: now.Add(2 * time.Hour),
		}
	case "hint_pack":
		return &BoostEffect{
			Type:      "hint_access",
			Value:     3.0, // 3次提示机会
			Duration:  90,  // 1.5小时
			ExpiresAt: now.Add(90 * time.Minute),
		}
	default:
		return nil
	}
}

// executeBoostEffect 执行道具效果的具体逻辑
func (bs *BoostService) executeBoostEffect(userID string, effect *BoostEffect) error {
	switch effect.Type {
	case "xp_multiplier":
		// XP倍增器不需要立即执行，在获得XP时检查
		return nil
	case "accuracy_boost":
		// 准确率加成在复习时计算
		return nil
	case "time_extension":
		// 时间延长在复习会话时应用
		return nil
	case "streak_protection":
		// 连击保护在连击断开时检查
		return nil
	case "hint_access":
		// 提示功能在需要时检查
		return nil
	default:
		return errors.New("未知的道具效果类型")
	}
}

// GetActiveBoosts 获取用户当前激活的道具效果
func (bs *BoostService) GetActiveBoosts(userID string) ([]UserBoost, error) {
	var boosts []UserBoost
	now := time.Now()

	err := bs.db.Where("user_id = ? AND is_active = true AND expires_at > ?",
		userID, now).
		Preload("Item").
		Find(&boosts).Error

	return boosts, err
}

// HasActiveBoost 检查用户是否有指定类型的激活道具
func (bs *BoostService) HasActiveBoost(userID, effectType string) (*UserBoost, bool) {
	var boost UserBoost
	now := time.Now()

	err := bs.db.Where("user_id = ? AND is_active = true AND expires_at > ? AND effect->>'type' = ?",
		userID, now, effectType).First(&boost).Error

	if err != nil {
		return nil, false
	}

	return &boost, true
}

// ApplyXPMultiplier 应用XP倍增器
func (bs *BoostService) ApplyXPMultiplier(userID string, baseXP int) int {
	if boost, hasBoost := bs.HasActiveBoost(userID, "xp_multiplier"); hasBoost {
		return int(float64(baseXP) * boost.Effect.Value)
	}
	return baseXP
}

// CheckStreakProtection 检查连击保护
func (bs *BoostService) CheckStreakProtection(userID string) bool {
	if boost, hasBoost := bs.HasActiveBoost(userID, "streak_protection"); hasBoost {
		// 消费掉保护效果
		bs.db.Model(&boost).Update("is_active", false)
		return true
	}
	return false
}

// GetHintCount 获取可用的提示次数
func (bs *BoostService) GetHintCount(userID string) int {
	if boost, hasBoost := bs.HasActiveBoost(userID, "hint_access"); hasBoost {
		return int(boost.Effect.Value)
	}
	return 0
}

// UseHint 使用一次提示
func (bs *BoostService) UseHint(userID string) error {
	if boost, hasBoost := bs.HasActiveBoost(userID, "hint_access"); hasBoost {
		if boost.Effect.Value <= 1 {
			// 最后一次使用，停用该效果
			return bs.db.Model(&boost).Update("is_active", false).Error
		} else {
			// 减少使用次数
			boost.Effect.Value -= 1
			return bs.db.Model(&boost).Update("effect", boost.Effect).Error
		}
	}
	return errors.New("没有可用的提示次数")
}

// CleanExpiredBoosts 清理过期的道具效果
func (bs *BoostService) CleanExpiredBoosts() error {
	now := time.Now()
	return bs.db.Model(&UserBoost{}).
		Where("is_active = true AND expires_at <= ?", now).
		Update("is_active", false).Error
}

// GetBoostStats 获取道具使用统计
func (bs *BoostService) GetBoostStats(userID string) (map[string]interface{}, error) {
	var stats struct {
		TotalUsed   int64
		ActiveCount int64
		MostUsed    string
	}

	// 总使用次数
	bs.db.Model(&UserBoost{}).Where("user_id = ?", userID).Count(&stats.TotalUsed)

	// 当前激活数量
	now := time.Now()
	bs.db.Model(&UserBoost{}).
		Where("user_id = ? AND is_active = true AND expires_at > ?", userID, now).
		Count(&stats.ActiveCount)

	// 最常用的道具类型
	var mostUsedResult struct {
		ItemType string
		Count    int64
	}

	bs.db.Model(&UserBoost{}).
		Select("items.item_type, COUNT(*) as count").
		Joins("JOIN shop_items as items ON items.id = user_boosts.item_id").
		Where("user_boosts.user_id = ?", userID).
		Group("items.item_type").
		Order("count DESC").
		Limit(1).
		Scan(&mostUsedResult)

	stats.MostUsed = mostUsedResult.ItemType

	return map[string]interface{}{
		"total_used":   stats.TotalUsed,
		"active_count": stats.ActiveCount,
		"most_used":    stats.MostUsed,
	}, nil
}