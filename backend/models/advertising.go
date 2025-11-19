package models

import (
	"time"
	"gorm.io/gorm"
)

// Advertisement 广告
type Advertisement struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`

	// 广告类型
	AdType      string    `json:"ad_type" gorm:"index"` // banner/interstitial/reward_video/native
	Position    string    `json:"position" gorm:"index"` // home_banner/review_interstitial/reward_video
	Provider    string    `json:"provider"` // google_admob/custom/affiliate

	// 广告内容
	ImageURL    string    `json:"image_url"`
	VideoURL    string    `json:"video_url"`
	TargetURL   string    `json:"target_url"`
	AdCode      string    `json:"ad_code" gorm:"type:text"` // AdSense代码

	// 奖励设置
	RewardType  string    `json:"reward_type"` // xp/coins/item
	RewardAmount int      `json:"reward_amount" gorm:"default:0"`
	WatchDuration int     `json:"watch_duration"` // 秒，视频广告需要观看的时长

	// 展示设置
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	Priority    int       `json:"priority" gorm:"default:1"` // 优先级，数字越大越优先
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`

	// 统计
	ViewCount   int       `json:"view_count" gorm:"default:0"`
	ClickCount  int       `json:"click_count" gorm:"default:0"`
	RewardCount int       `json:"reward_count" gorm:"default:0"` // 奖励发放次数

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// AdView 广告浏览记录
type AdView struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AdID        string    `json:"ad_id" gorm:"type:uuid;index;not null"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`

	// 浏览信息
	ViewDuration int      `json:"view_duration"` // 实际观看时长（秒）
	IsCompleted  bool     `json:"is_completed"` // 是否看完
	DidClick     bool     `json:"did_click"` // 是否点击
	GotReward    bool     `json:"got_reward"` // 是否获得奖励

	// 设备信息
	DeviceType  string    `json:"device_type"` // mobile/tablet/desktop
	Platform    string    `json:"platform"` // ios/android/web
	UserAgent   string    `json:"user_agent"`

	ViewedAt    time.Time `json:"viewed_at"`

	Ad          Advertisement `json:"ad,omitempty" gorm:"foreignKey:AdID"`
	User        User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// AdReward 广告奖励记录
type AdReward struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AdID        string    `json:"ad_id" gorm:"type:uuid;index;not null"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`
	ViewID      string    `json:"view_id" gorm:"type:uuid;index"` // 关联的浏览记录

	// 奖励详情
	RewardType  string    `json:"reward_type"` // xp/coins/item
	RewardAmount int      `json:"reward_amount"`
	ItemID      string    `json:"item_id" gorm:"type:uuid"` // 如果奖励是物品

	CreatedAt   time.Time `json:"created_at"`

	Ad          Advertisement `json:"ad,omitempty" gorm:"foreignKey:AdID"`
	User        User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// UserAdQuota 用户广告配额（限制每日观看次数）
type UserAdQuota struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string    `json:"user_id" gorm:"type:uuid;uniqueIndex:idx_user_date"`
	Date        time.Time `json:"date" gorm:"uniqueIndex:idx_user_date;type:date"`

	// 观看次数
	TotalViews  int       `json:"total_views" gorm:"default:0"`
	RewardViews int       `json:"reward_views" gorm:"default:0"` // 获得奖励的次数

	// 奖励总计
	TotalXPEarned int    `json:"total_xp_earned" gorm:"default:0"`

	UpdatedAt   time.Time `json:"updated_at"`

	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// 广告类型常量
const (
	AdTypeBanner       = "banner"
	AdTypeInterstitial = "interstitial"
	AdTypeRewardVideo  = "reward_video"
	AdTypeNative       = "native"
)

// 广告位置常量
const (
	AdPositionHomeBanner      = "home_banner"
	AdPositionReviewInter     = "review_interstitial"
	AdPositionRewardVideo     = "reward_video"
	AdPositionDashboardBanner = "dashboard_banner"
)

// 奖励类型常量
const (
	AdRewardTypeXP    = "xp"
	AdRewardTypeCoins = "coins"
	AdRewardTypeItem  = "item"
)
