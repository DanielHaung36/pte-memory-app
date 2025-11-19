package services

import (
	"encoding/json"
	"fmt"
	"log"
	"pte-memory-backend/models"
	"time"

	"gorm.io/gorm"
)

var pushDB *gorm.DB

// InitPushService 初始化推送服务
func InitPushService(database *gorm.DB) {
	pushDB = database
	log.Println("Push notification service initialized")
}

// RegisterDeviceToken 注册设备Token
func RegisterDeviceToken(userID, token, deviceType, deviceName string) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	// 检查Token是否已存在
	var existingToken models.DeviceToken
	err := pushDB.Where("token = ?", token).First(&existingToken).Error

	if err == gorm.ErrRecordNotFound {
		// 创建新Token
		deviceToken := models.DeviceToken{
			UserID:     userID,
			Token:      token,
			DeviceType: deviceType,
			DeviceName: deviceName,
			IsActive:   true,
			LastUsedAt: time.Now(),
		}
		return pushDB.Create(&deviceToken).Error
	}

	// 更新现有Token
	updates := map[string]interface{}{
		"user_id":      userID,
		"is_active":    true,
		"last_used_at": time.Now(),
	}
	if deviceName != "" {
		updates["device_name"] = deviceName
	}

	return pushDB.Model(&existingToken).Updates(updates).Error
}

// UnregisterDeviceToken 注销设备Token（用户退出登录）
func UnregisterDeviceToken(token string) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	return pushDB.Model(&models.DeviceToken{}).
		Where("token = ?", token).
		Update("is_active", false).Error
}

// SendPushNotification 发送推送通知
func SendPushNotification(userID, title, message, actionURL string, data map[string]interface{}) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	// 获取用户的所有活跃设备
	var tokens []models.DeviceToken
	err := pushDB.Where("user_id = ? AND is_active = ?", userID, true).Find(&tokens).Error
	if err != nil {
		return err
	}

	if len(tokens) == 0 {
		log.Printf("No active devices found for user %s", userID)
		return nil // 没有设备不算错误
	}

	// 创建推送记录
	notification := models.PushNotification{
		UserID:    userID,
		Title:     title,
		Body:      message,
		ActionURL: actionURL,
		Status:    "pending",
	}

	if data != nil {
		dataJSON, _ := json.Marshal(data)
		notification.Data = string(dataJSON)
	}

	if err := pushDB.Create(&notification).Error; err != nil {
		return err
	}

	// 发送推送到各个设备
	successCount := 0
	for _, token := range tokens {
		var err error
		switch token.DeviceType {
		case "ios":
			err = sendAPNs(token.Token, title, message, actionURL, data)
		case "android", "web":
			err = sendFCM(token.Token, title, message, actionURL, data)
		default:
			log.Printf("Unknown device type: %s", token.DeviceType)
			continue
		}

		if err != nil {
			log.Printf("Failed to send push to %s: %v", token.Token, err)
		} else {
			successCount++
			// 更新Token最后使用时间
			pushDB.Model(&token).Update("last_used_at", time.Now())
		}
	}

	// 更新推送状态
	status := "failed"
	if successCount > 0 {
		status = "sent"
	}
	if successCount == len(tokens) {
		status = "delivered"
	}

	pushDB.Model(&notification).Updates(map[string]interface{}{
		"status":   status,
		"sent_at":  time.Now(),
		"attempts": successCount,
	})

	return nil
}

// SendBatchPushNotification 批量发送推送通知
func SendBatchPushNotification(userIDs []string, title, message, actionURL string, data map[string]interface{}) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	for _, userID := range userIDs {
		// 异步发送，避免阻塞
		go func(uid string) {
			if err := SendPushNotification(uid, title, message, actionURL, data); err != nil {
				log.Printf("Failed to send push to user %s: %v", uid, err)
			}
		}(userID)
	}

	return nil
}

// SendPushFromTemplate 使用模板发送推送
func SendPushFromTemplate(userID, templateName string, variables map[string]string) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	// 获取推送模板
	var template models.PushTemplate
	err := pushDB.Where("name = ? AND is_active = ?", templateName, true).First(&template).Error
	if err != nil {
		return fmt.Errorf("template not found: %s", templateName)
	}

	// 替换变量
	title := replaceVariables(template.TitleTemplate, variables)
	message := replaceVariables(template.BodyTemplate, variables)
	actionURL := "/dashboard" // 默认跳转地址

	return SendPushNotification(userID, title, message, actionURL, nil)
}

// sendFCM 发送Firebase Cloud Messaging推送（Android/Web）
func sendFCM(token, title, message, actionURL string, data map[string]interface{}) error {
	// TODO: 实际实现需要Firebase Admin SDK
	// 这里是示例代码结构

	log.Printf("Sending FCM push to %s: %s - %s", token, title, message)

	/*
	// 实际实现示例：
	ctx := context.Background()

	msg := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  message,
		},
		Data: data,
		Webpush: &messaging.WebpushConfig{
			Notification: &messaging.WebpushNotification{
				Title: title,
				Body:  message,
				Icon:  "/icon.png",
			},
			FcmOptions: &messaging.WebpushFcmOptions{
				Link: actionURL,
			},
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Title:       title,
				Body:        message,
				ClickAction: actionURL,
			},
		},
	}

	response, err := firebaseApp.Messaging().Send(ctx, msg)
	if err != nil {
		return err
	}

	log.Printf("FCM response: %s", response)
	*/

	// 模拟成功
	return nil
}

// sendAPNs 发送Apple Push Notification Service推送（iOS）
func sendAPNs(token, title, message, actionURL string, data map[string]interface{}) error {
	// TODO: 实际实现需要APNs证书和库（如 github.com/sideshow/apns2）
	// 这里是示例代码结构

	log.Printf("Sending APNs push to %s: %s - %s", token, title, message)

	/*
	// 实际实现示例：
	notification := &apns2.Notification{
		DeviceToken: token,
		Topic:       "com.yourapp.pte-memory",
		Payload: &payload.Payload{
			Alert: payload.Alert{
				Title: title,
				Body:  message,
			},
			Badge: 1,
			Sound: "default",
			CustomData: data,
		},
	}

	response, err := apnsClient.Push(notification)
	if err != nil {
		return err
	}

	if response.StatusCode != 200 {
		return fmt.Errorf("APNs error: %s", response.Reason)
	}
	*/

	// 模拟成功
	return nil
}

// replaceVariables 替换模板中的变量
func replaceVariables(template string, variables map[string]string) string {
	result := template
	for key, value := range variables {
		placeholder := "{{" + key + "}}"
		result = replaceAll(result, placeholder, value)
	}
	return result
}

// replaceAll 简单的字符串替换
func replaceAll(s, old, new string) string {
	// 简单实现，实际可使用 strings.ReplaceAll
	result := ""
	for len(s) > 0 {
		index := indexOf(s, old)
		if index == -1 {
			result += s
			break
		}
		result += s[:index] + new
		s = s[index+len(old):]
	}
	return result
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// GetUserDevices 获取用户的设备列表
func GetUserDevices(userID string) ([]models.DeviceToken, error) {
	if pushDB == nil {
		return nil, fmt.Errorf("push service not initialized")
	}

	var tokens []models.DeviceToken
	err := pushDB.Where("user_id = ?", userID).
		Order("last_used_at DESC").
		Find(&tokens).Error

	return tokens, err
}

// CleanupInactiveDevices 清理长时间未使用的设备Token
func CleanupInactiveDevices() error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	// 删除3个月未使用的设备Token
	threeMonthsAgo := time.Now().AddDate(0, -3, 0)

	result := pushDB.Where("last_used_at < ? AND is_active = ?", threeMonthsAgo, false).
		Delete(&models.DeviceToken{})

	if result.Error != nil {
		return result.Error
	}

	log.Printf("Cleaned up %d inactive device tokens", result.RowsAffected)
	return nil
}

// GetPushHistory 获取用户的推送历史
func GetPushHistory(userID string, limit int) ([]models.PushNotification, error) {
	if pushDB == nil {
		return nil, fmt.Errorf("push service not initialized")
	}

	var notifications []models.PushNotification
	err := pushDB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error

	return notifications, err
}

// CreatePushTemplate 创建推送模板
func CreatePushTemplate(name, category, titleTemplate, bodyTemplate string) error {
	if pushDB == nil {
		return fmt.Errorf("push service not initialized")
	}

	template := models.PushTemplate{
		Name:          name,
		Category:      category,
		TitleTemplate: titleTemplate,
		BodyTemplate:  bodyTemplate,
		IsActive:      true,
	}

	return pushDB.Create(&template).Error
}

// SendReviewReminder 发送复习提醒推送
func SendReviewReminder(userID string, dueCount int) error {
	return SendPushFromTemplate(userID, "review_reminder", map[string]string{
		"count": fmt.Sprintf("%d", dueCount),
	})
}

// SendStreakReminder 发送连击保护提醒
func SendStreakReminder(userID string, streakDays int) error {
	return SendPushFromTemplate(userID, "streak_reminder", map[string]string{
		"days": fmt.Sprintf("%d", streakDays),
	})
}

// SendAchievementUnlocked 发送成就解锁推送
func SendAchievementUnlocked(userID, achievementName string) error {
	return SendPushFromTemplate(userID, "achievement_unlocked", map[string]string{
		"achievement": achievementName,
	})
}

// SendLevelUp 发送升级推送
func SendLevelUp(userID string, newLevel int) error {
	return SendPushFromTemplate(userID, "level_up", map[string]string{
		"level": fmt.Sprintf("%d", newLevel),
	})
}
