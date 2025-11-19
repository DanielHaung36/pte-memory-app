package services

import (
	"fmt"
	"pte-memory-backend/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

var db *gorm.DB

// InitReminderService 初始化提醒服务
func InitReminderService(database *gorm.DB) {
	db = database
}

// CheckAndSendReminders 定时检查并发送提醒（建议每小时运行一次）
func CheckAndSendReminders() {
	if db == nil {
		return
	}
	checkDailyReminders()
	checkReviewDueReminders()
	checkStreakRiskReminders()
	checkGoalReminders()
	cleanupExpiredNotifications()
}

// checkDailyReminders 检查每日学习提醒
func checkDailyReminders() {
	now := time.Now()
	currentHour := now.Format("15:04")
	currentDay := now.Weekday().String()

	var settings []models.ReminderSettings
	db.Where("enable_daily_reminder = ?", true).Find(&settings)

	for _, setting := range settings {
		// 检查是否在免打扰时段
		if isInDoNotDisturbPeriod(setting, now) {
			continue
		}

		// 检查时间是否匹配
		if setting.DailyReminderTime == currentHour {
			// 检查是否是设定的星期几
			if len(setting.DailyReminderDays) == 0 || contains(setting.DailyReminderDays, currentDay) {
				// 检查今天是否已学习
				var stats models.UserStats
				db.Where("user_id = ?", setting.UserID).First(&stats)

				if stats.LastStudyDate == nil || !isSameDay(*stats.LastStudyDate, now) {
					SendNotification(setting.UserID, models.NotificationTypeDaily, "每日学习提醒",
						"今天还没有学习哦！坚持每天练习，保持学习习惯！", "/dashboard")
				}
			}
		}
	}
}

// checkReviewDueReminders 检查复习到期提醒
func checkReviewDueReminders() {
	now := time.Now()

	var settings []models.ReminderSettings
	db.Where("enable_review_reminder = ?", true).Find(&settings)

	for _, setting := range settings {
		if isInDoNotDisturbPeriod(setting, now) {
			continue
		}

		// 计算提前提醒时间
		advanceTime := now.Add(time.Duration(setting.ReviewAdvanceHours) * time.Hour)

		// 查找即将到期的复习题目
		var dueCount int64
		db.Model(&models.ReviewSchedule{}).
			Where("user_id = ? AND next_review_date BETWEEN ? AND ? AND is_completed = ?",
				setting.UserID, now, advanceTime, false).
			Count(&dueCount)

		if dueCount > 0 {
			message := fmt.Sprintf("你有 %d 道题目即将到期需要复习，点击查看详情", dueCount)
			SendNotification(setting.UserID, models.NotificationTypeReviewDue, "复习提醒", message, "/review")
		}
	}
}

// checkStreakRiskReminders 检查连击风险提醒
func checkStreakRiskReminders() {
	now := time.Now()

	var settings []models.ReminderSettings
	db.Where("enable_streak_reminder = ?", true).Find(&settings)

	for _, setting := range settings {
		if isInDoNotDisturbPeriod(setting, now) {
			continue
		}

		currentHour := now.Format("15:04")
		if setting.StreakReminderTime == currentHour {
			// 检查用户今天是否已学习
			var user models.User
			db.Preload("UserStats").First(&user, "id = ?", setting.UserID)

			if user.Streak > 0 {
				var stats models.UserStats
				db.Where("user_id = ?", setting.UserID).First(&stats)

				// 如果今天还没学习
				if stats.LastStudyDate == nil || !isSameDay(*stats.LastStudyDate, now) {
					message := fmt.Sprintf("你当前有 %d 天连击！今天还没有学习，别让连击中断哦！", user.Streak)
					SendNotification(setting.UserID, models.NotificationTypeStreakRisk, "连击保护提醒", message, "/dashboard")
				}
			}
		}
	}
}

// checkGoalReminders 检查学习目标提醒
func checkGoalReminders() {
	now := time.Now()

	var settings []models.ReminderSettings
	db.Where("enable_goal_reminder = ?", true).Find(&settings)

	for _, setting := range settings {
		if isInDoNotDisturbPeriod(setting, now) {
			continue
		}

		currentHour := now.Format("15:04")
		if setting.GoalCheckTime == currentHour {
			// 检查今日目标完成情况
			var stats models.UserStats
			db.Where("user_id = ?", setting.UserID).First(&stats)

			// 统计今日复习数量
			var todayCount int64
			startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			db.Model(&models.ReviewSession{}).
				Where("user_id = ? AND reviewed_at >= ?", setting.UserID, startOfDay).
				Count(&todayCount)

			if int(todayCount) < stats.DailyGoal {
				remaining := stats.DailyGoal - int(todayCount)
				message := fmt.Sprintf("今日目标：%d 题，已完成：%d 题，还差 %d 题！",
					stats.DailyGoal, todayCount, remaining)
				SendNotification(setting.UserID, models.NotificationTypeGoalIncomplete,
					"学习目标提醒", message, "/review")
			}
		}
	}
}

// SendNotification 发送通知
func SendNotification(userID, notificationType, title, message, actionURL string) error {
	notification := models.Notification{
		UserID:    userID,
		Type:      notificationType,
		Category:  getCategoryByType(notificationType),
		Title:     title,
		Message:   message,
		ActionURL: actionURL,
		Priority:  getPriorityByType(notificationType),
	}

	if err := db.Create(&notification).Error; err != nil {
		return err
	}

	// 发送WebSocket实时推送
	// websocket.BroadcastToUser(userID, "notification", notification)

	return nil
}

// CreateAchievementNotification 创建成就通知
func CreateAchievementNotification(userID, achievementTitle, achievementDesc string) {
	SendNotification(userID, models.NotificationTypeAchievement,
		"成就解锁！",
		fmt.Sprintf("恭喜你解锁成就：%s - %s", achievementTitle, achievementDesc),
		"/achievements")
}

// CreateLevelUpNotification 创建升级通知
func CreateLevelUpNotification(userID string, newLevel int) {
	SendNotification(userID, models.NotificationTypeLevelUp,
		"恭喜升级！",
		fmt.Sprintf("恭喜你升到了 Level %d！继续加油！", newLevel),
		"/dashboard")
}

// cleanupExpiredNotifications 清理过期通知
func cleanupExpiredNotifications() {
	now := time.Now()
	db.Where("expires_at < ?", now).Delete(&models.Notification{})

	// 删除30天前已读的通知
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	db.Where("is_read = ? AND read_at < ?", true, thirtyDaysAgo).Delete(&models.Notification{})
}

// MarkNotificationAsRead 标记通知为已读
func MarkNotificationAsRead(notificationID string) error {
	now := time.Now()
	return db.Model(&models.Notification{}).
		Where("id = ?", notificationID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// MarkAllAsRead 标记所有通知为已读
func MarkAllAsRead(userID string) error {
	now := time.Now()
	return db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// GetUnreadCount 获取未读通知数量
func GetUnreadCount(userID string) (int64, error) {
	var count int64
	err := db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// GetNotifications 获取通知列表
func GetNotifications(userID string, limit, offset int, unreadOnly bool) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	query := db.Model(&models.Notification{}).Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	query.Count(&total)

	err := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
}

// InitializeUserReminderSettings 初始化用户提醒设置（注册时调用）
func InitializeUserReminderSettings(userID string) error {
	settings := models.ReminderSettings{
		UserID:                userID,
		EnableDailyReminder:   true,
		DailyReminderTime:     "09:00",
		DailyReminderDays:     []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"},
		EnableReviewReminder:  true,
		ReviewAdvanceHours:    2,
		ReviewReminderTime:    "19:00",
		EnableStreakReminder:  true,
		StreakReminderTime:    "20:00",
		EnableGoalReminder:    true,
		GoalCheckTime:         "21:00",
		EnableWebPush:         true,
		EnableEmail:           false,
		EnableSound:           true,
		EnableDoNotDisturb:    false,
		Timezone:              "Asia/Shanghai",
	}

	return db.Create(&settings).Error
}

// 辅助函数

func isInDoNotDisturbPeriod(setting models.ReminderSettings, now time.Time) bool {
	if !setting.EnableDoNotDisturb {
		return false
	}

	currentTime := now.Format("15:04")
	start := setting.DoNotDisturbStart
	end := setting.DoNotDisturbEnd

	if start == "" || end == "" {
		return false
	}

	// 处理跨天情况
	if start < end {
		return currentTime >= start && currentTime <= end
	} else {
		return currentTime >= start || currentTime <= end
	}
}

func isSameDay(t1, t2 time.Time) bool {
	y1, m1, d1 := t1.Date()
	y2, m2, d2 := t2.Date()
	return y1 == y2 && m1 == m2 && d1 == d2
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if strings.EqualFold(s, item) {
			return true
		}
	}
	return false
}

func getCategoryByType(notificationType string) string {
	switch notificationType {
	case models.NotificationTypeDaily, models.NotificationTypeReviewDue,
		 models.NotificationTypeStreakRisk, models.NotificationTypeGoalIncomplete:
		return models.NotificationCategoryReminder
	case models.NotificationTypeAchievement, models.NotificationTypeLevelUp:
		return models.NotificationCategoryAchievement
	case models.NotificationTypeSocial:
		return models.NotificationCategorySocial
	default:
		return models.NotificationCategorySystem
	}
}

func getPriorityByType(notificationType string) int {
	switch notificationType {
	case models.NotificationTypeStreakRisk:
		return 5 // 最高优先级
	case models.NotificationTypeReviewDue:
		return 4
	case models.NotificationTypeGoalIncomplete:
		return 3
	case models.NotificationTypeAchievement, models.NotificationTypeLevelUp:
		return 4
	case models.NotificationTypeDaily:
		return 2
	default:
		return 1
	}
}
