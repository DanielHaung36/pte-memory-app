package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetAdvertisements 获取广告列表
// GET /api/ads?position=home_banner&type=banner
func GetAdvertisements(c *gin.Context) {
	position := c.Query("position")
	adType := c.Query("type")

	query := database.DB.Where("is_active = ?", true)

	if position != "" {
		query = query.Where("position = ?", position)
	}
	if adType != "" {
		query = query.Where("ad_type = ?", adType)
	}

	// 检查有效期
	now := time.Now()
	query = query.Where("(start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", now, now)

	var ads []models.Advertisement
	err := query.Order("priority DESC, RANDOM()").Limit(10).Find(&ads).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取广告失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ads":   ads,
		"count": len(ads),
	})
}

// RecordAdView 记录广告浏览
// POST /api/ads/:id/view
func RecordAdView(c *gin.Context) {
	userID := c.GetString("user_id")
	adID := c.Param("id")

	var input struct {
		ViewDuration int    `json:"view_duration"`
		DidClick     bool   `json:"did_click"`
		DeviceType   string `json:"device_type"`
		Platform     string `json:"platform"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建浏览记录
	view := models.AdView{
		AdID:         adID,
		UserID:       userID,
		ViewDuration: input.ViewDuration,
		DidClick:     input.DidClick,
		DeviceType:   input.DeviceType,
		Platform:     input.Platform,
		UserAgent:    c.Request.UserAgent(),
	}

	// 检查是否看完（视频广告）
	var ad models.Advertisement
	database.DB.First(&ad, "id = ?", adID)
	if ad.WatchDuration > 0 && input.ViewDuration >= ad.WatchDuration {
		view.IsCompleted = true
	}

	if err := database.DB.Create(&view).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "记录失败"})
		return
	}

	// 更新广告统计
	updates := map[string]interface{}{
		"view_count": gorm.Expr("view_count + 1"),
	}
	if input.DidClick {
		updates["click_count"] = gorm.Expr("click_count + 1")
	}
	database.DB.Model(&ad).Updates(updates)

	c.JSON(http.StatusOK, gin.H{
		"message": "记录成功",
		"view_id": view.ID,
	})
}

// ClaimAdReward 领取广告奖励
// POST /api/ads/:id/reward
func ClaimAdReward(c *gin.Context) {
	userID := c.GetString("user_id")
	adID := c.Param("id")

	var input struct {
		ViewID string `json:"view_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证浏览记录
	var view models.AdView
	if err := database.DB.First(&view, "id = ? AND user_id = ? AND ad_id = ?", input.ViewID, userID, adID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "浏览记录不存在"})
		return
	}

	if !view.IsCompleted {
		c.JSON(http.StatusForbidden, gin.H{"error": "未完成观看"})
		return
	}

	if view.GotReward {
		c.JSON(http.StatusForbidden, gin.H{"error": "已领取过奖励"})
		return
	}

	// 获取广告信息
	var ad models.Advertisement
	if err := database.DB.First(&ad, "id = ?", adID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "广告不存在"})
		return
	}

	// 检查每日限额
	today := time.Now().Truncate(24 * time.Hour)
	var quota models.UserAdQuota
	err := database.DB.Where("user_id = ? AND date = ?", userID, today).First(&quota).Error
	if err == gorm.ErrRecordNotFound {
		quota = models.UserAdQuota{
			UserID: userID,
			Date:   today,
		}
		database.DB.Create(&quota)
	}

	// 限制每日奖励次数（例如最多5次）
	if quota.RewardViews >= 5 {
		c.JSON(http.StatusForbidden, gin.H{"error": "今日奖励次数已用完"})
		return
	}

	tx := database.DB.Begin()

	// 创建奖励记录
	reward := models.AdReward{
		AdID:         adID,
		UserID:       userID,
		ViewID:       view.ID,
		RewardType:   ad.RewardType,
		RewardAmount: ad.RewardAmount,
	}

	if err := tx.Create(&reward).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "领取失败"})
		return
	}

	// 发放奖励
	var user models.User
	tx.First(&user, "id = ?", userID)

	switch ad.RewardType {
	case models.AdRewardTypeXP:
		user.AddXP(ad.RewardAmount)
		tx.Save(&user)
	// 可以添加其他奖励类型
	}

	// 更新浏览记录
	tx.Model(&view).Update("got_reward", true)

	// 更新广告统计
	tx.Model(&ad).Update("reward_count", gorm.Expr("reward_count + 1"))

	// 更新配额
	tx.Model(&quota).Updates(map[string]interface{}{
		"reward_views":    quota.RewardViews + 1,
		"total_xp_earned": quota.TotalXPEarned + ad.RewardAmount,
	})

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":       "领取成功",
		"reward_type":   ad.RewardType,
		"reward_amount": ad.RewardAmount,
		"new_xp":        user.XP,
	})
}

// GetAdQuota 获取今日广告观看配额
// GET /api/ads/quota
func GetAdQuota(c *gin.Context) {
	userID := c.GetString("user_id")

	today := time.Now().Truncate(24 * time.Hour)
	var quota models.UserAdQuota
	err := database.DB.Where("user_id = ? AND date = ?", userID, today).First(&quota).Error

	if err == gorm.ErrRecordNotFound {
		quota = models.UserAdQuota{
			UserID: userID,
			Date:   today,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"quota": quota,
		"max_reward_views": 5,
		"remaining":        5 - quota.RewardViews,
	})
}

// Admin endpoints

// CreateAdvertisement 创建广告（管理员）
// POST /api/admin/ads
func CreateAdvertisement(c *gin.Context) {
	var input models.Advertisement

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateAdvertisement 更新广告（管理员）
// PUT /api/admin/ads/:id
func UpdateAdvertisement(c *gin.Context) {
	adID := c.Param("id")

	var input models.Advertisement
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Advertisement{}).Where("id = ?", adID).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	var ad models.Advertisement
	database.DB.First(&ad, "id = ?", adID)

	c.JSON(http.StatusOK, ad)
}

// GetAdStatistics 获取广告统计（管理员）
// GET /api/admin/ads/:id/stats
func GetAdStatistics(c *gin.Context) {
	adID := c.Param("id")

	var ad models.Advertisement
	if err := database.DB.First(&ad, "id = ?", adID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "广告不存在"})
		return
	}

	// 统计详细数据
	var totalViews, completedViews, clickedViews int64
	database.DB.Model(&models.AdView{}).Where("ad_id = ?", adID).Count(&totalViews)
	database.DB.Model(&models.AdView{}).Where("ad_id = ? AND is_completed = ?", adID, true).Count(&completedViews)
	database.DB.Model(&models.AdView{}).Where("ad_id = ? AND did_click = ?", adID, true).Count(&clickedViews)

	// 计算转化率
	var ctr, completionRate float64
	if totalViews > 0 {
		ctr = float64(clickedViews) / float64(totalViews) * 100
		completionRate = float64(completedViews) / float64(totalViews) * 100
	}

	// 按日期统计
	var dailyStats []struct {
		Date      string `json:"date"`
		Views     int    `json:"views"`
		Completed int    `json:"completed"`
		Clicks    int    `json:"clicks"`
	}

	database.DB.Raw(`
		SELECT
			DATE(viewed_at) as date,
			COUNT(*) as views,
			COUNT(CASE WHEN is_completed THEN 1 END) as completed,
			COUNT(CASE WHEN did_click THEN 1 END) as clicks
		FROM ad_views
		WHERE ad_id = ?
		GROUP BY DATE(viewed_at)
		ORDER BY date DESC
		LIMIT 30
	`, adID).Scan(&dailyStats)

	c.JSON(http.StatusOK, gin.H{
		"ad":              ad,
		"total_views":     totalViews,
		"completed_views": completedViews,
		"clicked_views":   clickedViews,
		"ctr":             ctr,
		"completion_rate": completionRate,
		"daily_stats":     dailyStats,
	})
}
