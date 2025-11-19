package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetReminderSettings 获取提醒设置
// GET /api/reminders/settings
func GetReminderSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	var settings models.ReminderSettings
	err := database.DB.Where("user_id = ?", userID).First(&settings).Error

	if err == gorm.ErrRecordNotFound {
		// 如果没有设置，创建默认设置
		if err := services.InitializeUserReminderSettings(userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "初始化设置失败"})
			return
		}
		database.DB.Where("user_id = ?", userID).First(&settings)
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取设置失败"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateReminderSettings 更新提醒设置
// PUT /api/reminders/settings
func UpdateReminderSettings(c *gin.Context) {
	userID := c.GetString("user_id")

	var input models.ReminderSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var settings models.ReminderSettings
	err := database.DB.Where("user_id = ?", userID).First(&settings).Error

	if err == gorm.ErrRecordNotFound {
		// 创建新设置
		input.UserID = userID
		if err := database.DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建设置失败"})
			return
		}
		c.JSON(http.StatusOK, input)
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取设置失败"})
		return
	}

	// 更新设置
	input.ID = settings.ID
	input.UserID = userID
	if err := database.DB.Save(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新设置失败"})
		return
	}

	c.JSON(http.StatusOK, input)
}

// GetNotifications 获取通知列表
// GET /api/notifications?limit=20&offset=0&unread_only=false
func GetNotifications(c *gin.Context) {
	userID := c.GetString("user_id")

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	unreadOnlyStr := c.DefaultQuery("unread_only", "false")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	unreadOnly := unreadOnlyStr == "true"

	notifications, total, err := services.GetNotifications(userID, limit, offset, unreadOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取通知失败"})
		return
	}

	// 获取未读数量
	unreadCount, _ := services.GetUnreadCount(userID)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"total":         total,
		"unread_count":  unreadCount,
		"limit":         limit,
		"offset":        offset,
	})
}

// MarkNotificationRead 标记通知为已读
// PUT /api/notifications/:id/read
func MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")
	userID := c.GetString("user_id")

	// 验证通知属于当前用户
	var notification models.Notification
	if err := database.DB.First(&notification, "id = ? AND user_id = ?", notificationID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "通知不存在"})
		return
	}

	if err := services.MarkNotificationAsRead(notificationID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "标记失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已标记为已读"})
}

// MarkAllNotificationsRead 标记所有通知为已读
// PUT /api/notifications/read-all
func MarkAllNotificationsRead(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := services.MarkAllAsRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "标记失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "所有通知已标记为已读"})
}

// DeleteNotification 删除通知
// DELETE /api/notifications/:id
func DeleteNotification(c *gin.Context) {
	notificationID := c.Param("id")
	userID := c.GetString("user_id")

	// 验证通知属于当前用户
	var notification models.Notification
	if err := database.DB.First(&notification, "id = ? AND user_id = ?", notificationID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "通知不存在"})
		return
	}

	if err := database.DB.Delete(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "通知已删除"})
}

// ClearAllNotifications 清空所有已读通知
// DELETE /api/notifications/clear
func ClearAllNotifications(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := database.DB.Where("user_id = ? AND is_read = ?", userID, true).
		Delete(&models.Notification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "清空失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已清空所有已读通知"})
}

// GetUnreadCount 获取未读通知数量
// GET /api/notifications/unread-count
func GetUnreadCount(c *gin.Context) {
	userID := c.GetString("user_id")

	count, err := services.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"unread_count": count,
	})
}

// TestNotification 测试通知（开发用）
// POST /api/notifications/test
func TestNotification(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Type    string `json:"type" binding:"required"`
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.SendNotification(userID, input.Type, input.Title, input.Message, "/dashboard"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "测试通知已发送"})
}

// GetNotificationsByType 按类型获取通知
// GET /api/notifications/type/:type
func GetNotificationsByType(c *gin.Context) {
	userID := c.GetString("user_id")
	notificationType := c.Param("type")

	var notifications []models.Notification
	if err := database.DB.Where("user_id = ? AND type = ?", userID, notificationType).
		Order("created_at DESC").
		Limit(50).
		Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取通知失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"type":          notificationType,
		"total":         len(notifications),
	})
}
