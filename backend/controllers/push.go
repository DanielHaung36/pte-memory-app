package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RegisterDeviceToken 注册设备Token
// POST /api/push/register
func RegisterDeviceToken(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Token       string `json:"token" binding:"required"`
		DeviceType  string `json:"device_type" binding:"required,oneof=ios android web"`
		DeviceName  string `json:"device_name"`
		DeviceModel string `json:"device_model"`
		AppVersion  string `json:"app_version"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.RegisterDeviceToken(userID, input.Token, input.DeviceType, input.DeviceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "设备注册成功",
	})
}

// UnregisterDeviceToken 注销设备Token
// POST /api/push/unregister
func UnregisterDeviceToken(c *gin.Context) {
	var input struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.UnregisterDeviceToken(input.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注销失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "设备注销成功",
	})
}

// GetUserDevices 获取用户的设备列表
// GET /api/push/devices
func GetUserDevices(c *gin.Context) {
	userID := c.GetString("user_id")

	devices, err := services.GetUserDevices(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取设备列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"devices": devices,
		"count":   len(devices),
	})
}

// SendTestPush 发送测试推送（开发用）
// POST /api/push/test
func SendTestPush(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Title     string                 `json:"title"`
		Message   string                 `json:"message"`
		ActionURL string                 `json:"action_url"`
		Data      map[string]interface{} `json:"data"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Title == "" {
		input.Title = "测试推送"
	}
	if input.Message == "" {
		input.Message = "这是一条测试推送消息"
	}

	err := services.SendPushNotification(userID, input.Title, input.Message, input.ActionURL, input.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "测试推送已发送",
	})
}

// GetPushHistory 获取推送历史
// GET /api/push/history?limit=50
func GetPushHistory(c *gin.Context) {
	userID := c.GetString("user_id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if limit > 100 {
		limit = 100
	}

	history, err := services.GetPushHistory(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取历史失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": history,
		"count":         len(history),
	})
}

// UpdatePushSettings 更新推送设置
// PUT /api/push/settings
func UpdatePushSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		EnablePush         bool `json:"enable_push"`
		EnableReview       bool `json:"enable_review"`
		EnableStreak       bool `json:"enable_streak"`
		EnableAchievement  bool `json:"enable_achievement"`
		EnableSocial       bool `json:"enable_social"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新ReminderSettings（推送设置存储在那里）
	var settings models.ReminderSettings
	err := database.DB.Where("user_id = ?", userID).First(&settings).Error

	if err != nil {
		// 创建新设置
		settings = models.ReminderSettings{
			UserID:                  userID,
			EnableDailyReminder:     input.EnablePush,
			EnableReviewReminder:    input.EnableReview,
			EnableStreakReminder:    input.EnableStreak,
			EnableGoalReminder:      input.EnableAchievement,
		}
		database.DB.Create(&settings)
	} else {
		// 更新设置
		updates := map[string]interface{}{
			"enable_daily_reminder":  input.EnablePush,
			"enable_review_reminder": input.EnableReview,
			"enable_streak_reminder": input.EnableStreak,
			"enable_goal_reminder":   input.EnableAchievement,
		}
		database.DB.Model(&settings).Updates(updates)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "推送设置已更新",
		"settings": settings,
	})
}

// GetPushSettings 获取推送设置
// GET /api/push/settings
func GetPushSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	var settings models.ReminderSettings
	err := database.DB.Where("user_id = ?", userID).First(&settings).Error

	if err != nil {
		// 返回默认设置
		c.JSON(http.StatusOK, gin.H{
			"enable_push":        true,
			"enable_review":      true,
			"enable_streak":      true,
			"enable_achievement": true,
			"enable_social":      false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"enable_push":        settings.EnableDailyReminder,
		"enable_review":      settings.EnableReviewReminder,
		"enable_streak":      settings.EnableStreakReminder,
		"enable_achievement": settings.EnableGoalReminder,
		"enable_social":      false,
	})
}

// ==================== 管理员功能 ====================

// SendBroadcastPush 发送广播推送（管理员）
// POST /api/admin/push/broadcast
func SendBroadcastPush(c *gin.Context) {
	var input struct {
		Title     string   `json:"title" binding:"required"`
		Message   string   `json:"message" binding:"required"`
		ActionURL string   `json:"action_url"`
		UserIDs   []string `json:"user_ids"` // 为空则发送给所有用户
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userIDs []string
	if len(input.UserIDs) > 0 {
		userIDs = input.UserIDs
	} else {
		// 获取所有用户ID
		var users []models.User
		database.DB.Select("id").Find(&users)
		for _, user := range users {
			userIDs = append(userIDs, user.ID)
		}
	}

	err := services.SendBatchPushNotification(userIDs, input.Title, input.Message, input.ActionURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "广播推送已发送",
		"count":   len(userIDs),
	})
}

// GetPushTemplates 获取推送模板列表（管理员）
// GET /api/admin/push/templates
func GetPushTemplates(c *gin.Context) {
	var templates []models.PushTemplate
	err := database.DB.Order("type").Find(&templates).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取模板失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"count":     len(templates),
	})
}

// CreatePushTemplate 创建推送模板（管理员）
// POST /api/admin/push/templates
func CreatePushTemplate(c *gin.Context) {
	var input models.PushTemplate

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.IsActive = true

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdatePushTemplate 更新推送模板（管理员）
// PUT /api/admin/push/templates/:id
func UpdatePushTemplate(c *gin.Context) {
	templateID := c.Param("id")

	var input models.PushTemplate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := database.DB.Model(&models.PushTemplate{}).
		Where("id = ?", templateID).
		Updates(input).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	var template models.PushTemplate
	database.DB.First(&template, "id = ?", templateID)

	c.JSON(http.StatusOK, template)
}

// GetPushStats 获取推送统计（管理员）
// GET /api/admin/push/stats
func GetPushStats(c *gin.Context) {
	var stats struct {
		TotalDevices     int64 `json:"total_devices"`
		ActiveDevices    int64 `json:"active_devices"`
		IOSDevices       int64 `json:"ios_devices"`
		AndroidDevices   int64 `json:"android_devices"`
		WebDevices       int64 `json:"web_devices"`
		TotalPushes      int64 `json:"total_pushes"`
		SentPushes       int64 `json:"sent_pushes"`
		DeliveredPushes  int64 `json:"delivered_pushes"`
		FailedPushes     int64 `json:"failed_pushes"`
	}

	database.DB.Model(&models.DeviceToken{}).Count(&stats.TotalDevices)
	database.DB.Model(&models.DeviceToken{}).Where("is_active = ?", true).Count(&stats.ActiveDevices)
	database.DB.Model(&models.DeviceToken{}).Where("device_type = ? AND is_active = ?", "ios", true).Count(&stats.IOSDevices)
	database.DB.Model(&models.DeviceToken{}).Where("device_type = ? AND is_active = ?", "android", true).Count(&stats.AndroidDevices)
	database.DB.Model(&models.DeviceToken{}).Where("device_type = ? AND is_active = ?", "web", true).Count(&stats.WebDevices)

	database.DB.Model(&models.PushNotification{}).Count(&stats.TotalPushes)
	database.DB.Model(&models.PushNotification{}).Where("status = ?", "sent").Count(&stats.SentPushes)
	database.DB.Model(&models.PushNotification{}).Where("status = ?", "delivered").Count(&stats.DeliveredPushes)
	database.DB.Model(&models.PushNotification{}).Where("status = ?", "failed").Count(&stats.FailedPushes)

	c.JSON(http.StatusOK, stats)
}
