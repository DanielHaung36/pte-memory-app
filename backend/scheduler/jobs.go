package scheduler

import (
	"time"

	"go.uber.org/zap"
	"pte-memory-backend/cache"
	"pte-memory-backend/database"
	"pte-memory-backend/logger"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
)

// CleanupExpiredDataJob cleans up expired data from the database
func CleanupExpiredDataJob() {
	logger.Info("Running cleanup expired data job...")

	db := database.DB

	// Delete old password reset tokens (older than 24 hours)
	result := db.Where("created_at < ?", time.Now().Add(-24*time.Hour)).
		Delete(&models.PasswordResetToken{})
	if result.Error != nil {
		logger.Error("Failed to cleanup password reset tokens", zap.Error(result.Error))
	} else {
		logger.Info("Cleaned up password reset tokens", zap.Int64("count", result.RowsAffected))
	}

	// Delete old ad views (older than 30 days)
	result = db.Where("created_at < ?", time.Now().Add(-30*24*time.Hour)).
		Delete(&models.AdView{})
	if result.Error != nil {
		logger.Error("Failed to cleanup ad views", zap.Error(result.Error))
	} else {
		logger.Info("Cleaned up old ad views", zap.Int64("count", result.RowsAffected))
	}

	// Reset daily ad quotas for yesterday
	result = db.Where("date < ?", time.Now().Format("2006-01-02")).
		Delete(&models.UserAdQuota{})
	if result.Error != nil {
		logger.Error("Failed to reset ad quotas", zap.Error(result.Error))
	} else {
		logger.Info("Reset old ad quotas", zap.Int64("count", result.RowsAffected))
	}

	logger.Info("Cleanup expired data job completed")
}

// SendReviewRemindersJob sends review reminders to users with due questions
func SendReviewRemindersJob() {
	logger.Info("Running send review reminders job...")

	db := database.DB

	// Find users with due questions
	var reviewSchedules []models.ReviewSchedule
	err := db.Where("next_review_date <= ?", time.Now()).
		Preload("Question").
		Preload("Question.User").
		Find(&reviewSchedules).Error

	if err != nil {
		logger.Error("Failed to fetch due reviews", zap.Error(err))
		return
	}

	// Group by user
	userDueCount := make(map[string]int)
	for _, schedule := range reviewSchedules {
		if schedule.Question.UserID != "" {
			userDueCount[schedule.Question.UserID]++
		}
	}

	// Send notifications
	for userID, count := range userDueCount {
		notification := models.Notification{
			UserID:  userID,
			Type:    "review_reminder",
			Title:   "复习提醒",
			Message: "你有 " + string(rune(count)) + " 道题目需要复习！",
			IsRead:  false,
		}

		if err := db.Create(&notification).Error; err != nil {
			logger.Error("Failed to create review reminder notification",
				zap.String("user_id", userID),
				zap.Error(err),
			)
		}
	}

	logger.Info("Send review reminders job completed",
		zap.Int("users_notified", len(userDueCount)),
	)
}

// GenerateDailyReportsJob generates daily learning reports for users
func GenerateDailyReportsJob() {
	logger.Info("Running generate daily reports job...")

	db := database.DB
	yesterday := time.Now().Add(-24 * time.Hour)

	// Find all active users (who reviewed yesterday)
	var sessions []models.ReviewSession
	err := db.Where("reviewed_at >= ? AND reviewed_at < ?",
		yesterday.Format("2006-01-02"),
		time.Now().Format("2006-01-02"),
	).Find(&sessions).Error

	if err != nil {
		logger.Error("Failed to fetch review sessions", zap.Error(err))
		return
	}

	// Group by user
	userStats := make(map[string]struct {
		total   int
		correct int
	})

	for _, session := range sessions {
		stats := userStats[session.UserID]
		stats.total++
		if session.IsCorrect {
			stats.correct++
		}
		userStats[session.UserID] = stats
	}

	// Create notifications for daily reports
	for userID, stats := range userStats {
		accuracy := 0
		if stats.total > 0 {
			accuracy = (stats.correct * 100) / stats.total
		}

		notification := models.Notification{
			UserID:  userID,
			Type:    "daily_report",
			Title:   "每日学习报告",
			Message: "昨日完成 " + string(rune(stats.total)) + " 道题，正确率 " + string(rune(accuracy)) + "%",
			IsRead:  false,
		}

		if err := db.Create(&notification).Error; err != nil {
			logger.Error("Failed to create daily report notification",
				zap.String("user_id", userID),
				zap.Error(err),
			)
		}
	}

	logger.Info("Generate daily reports job completed",
		zap.Int("reports_generated", len(userStats)),
	)
}

// UpdateUserStreaksJob updates user streaks based on daily activity
func UpdateUserStreaksJob() {
	logger.Info("Running update user streaks job...")

	db := database.DB
	yesterday := time.Now().Add(-24 * time.Hour)

	// Get all users
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		logger.Error("Failed to fetch users", zap.Error(err))
		return
	}

	for _, user := range users {
		// Check if user studied yesterday
		var count int64
		db.Model(&models.ReviewSession{}).
			Where("user_id = ? AND reviewed_at >= ? AND reviewed_at < ?",
				user.ID,
				yesterday.Format("2006-01-02"),
				time.Now().Format("2006-01-02"),
			).Count(&count)

		if count > 0 {
			// User studied yesterday, increment streak
			user.Streak++
			if user.Streak > user.BestStreak {
				user.BestStreak = user.Streak
			}
		} else {
			// User didn't study, reset streak
			if user.Streak > 0 {
				// Send streak broken notification
				notification := models.Notification{
					UserID:  user.ID,
					Type:    "streak_broken",
					Title:   "连击中断",
					Message: "你的学习连击已中断，继续加油！",
					IsRead:  false,
				}
				db.Create(&notification)
			}
			user.Streak = 0
		}

		if err := db.Save(&user).Error; err != nil {
			logger.Error("Failed to update user streak",
				zap.String("user_id", user.ID),
				zap.Error(err),
			)
		}
	}

	logger.Info("Update user streaks job completed", zap.Int("users_updated", len(users)))
}

// CleanupOldNotificationsJob deletes read notifications older than 30 days
func CleanupOldNotificationsJob() {
	logger.Info("Running cleanup old notifications job...")

	db := database.DB

	// Delete read notifications older than 30 days
	result := db.Where("is_read = ? AND created_at < ?",
		true,
		time.Now().Add(-30*24*time.Hour),
	).Delete(&models.Notification{})

	if result.Error != nil {
		logger.Error("Failed to cleanup notifications", zap.Error(result.Error))
	} else {
		logger.Info("Cleaned up old notifications", zap.Int64("count", result.RowsAffected))
	}

	logger.Info("Cleanup old notifications job completed")
}

// RefreshCacheJob refreshes cached data
func RefreshCacheJob() {
	logger.Info("Running refresh cache job...")

	if !cache.IsEnabled() {
		logger.Debug("Cache not enabled, skipping refresh")
		return
	}

	db := database.DB

	// Refresh shop items cache
	var shopItems []models.ShopItem
	if err := db.Where("is_active = ?", true).Find(&shopItems).Error; err == nil {
		cache.Set(cache.ShopItemsCacheKey(), shopItems, cache.TTLLong)
		logger.Debug("Refreshed shop items cache", zap.Int("count", len(shopItems)))
	}

	// Refresh leaderboard cache
	var topUsers []models.User
	if err := db.Order("xp DESC").Limit(100).Find(&topUsers).Error; err == nil {
		cache.Set(cache.LeaderboardCacheKey(), topUsers, cache.TTLMedium)
		logger.Debug("Refreshed leaderboard cache", zap.Int("count", len(topUsers)))
	}

	logger.Info("Refresh cache job completed")
}

// GenerateDailyReviewPlansJob generates daily review plans for all users
func GenerateDailyReviewPlansJob() {
	logger.Info("Running generate daily review plans job...")

	db := database.DB

	// Get all active users
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		logger.Error("Failed to fetch users", zap.Error(err))
		return
	}

	successCount := 0
	for _, user := range users {
		if err := services.GenerateDailyReviewPlan(db, user.ID); err != nil {
			logger.Error("Failed to generate review plan for user",
				zap.String("user_id", user.ID),
				zap.Error(err))
			continue
		}
		successCount++
	}

	logger.Info("Generate daily review plans job completed",
		zap.Int("total_users", len(users)),
		zap.Int("success_count", successCount))
}

// CheckAndSendRemindersJob runs reminder service checks
func CheckAndSendRemindersJob() {
	logger.Info("Running check and send reminders job...")

	// Call reminder service to check and send reminders
	services.CheckAndSendReminders()

	logger.Info("Check and send reminders job completed")
}
