package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
)

type UserController struct{}

// GetStats 获取用户统计信息
func (uc *UserController) GetStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 获取用户基本信息
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 计算各种统计数据
	stats := gin.H{
		"user_info": gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"email":        user.Email,
			"level":        user.Level,
			"xp":           user.XP,
			"streak":       user.Streak,
			"best_streak":  user.BestStreak,
			"created_at":   user.CreatedAt,
		},
	}

	// 获取题目统计
	var questionStats struct {
		TotalQuestions  int64
		ReviewedToday   int64
		CorrectToday    int64
		OverallAccuracy float64
	}

	// 总题目数
	database.DB.Model(&models.Question{}).Where("user_id = ?", userID).Count(&questionStats.TotalQuestions)

	// 今日复习统计
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	database.DB.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, today, tomorrow).
		Count(&questionStats.ReviewedToday)

	database.DB.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ? AND created_at < ? AND is_correct = true",
			userID, today, tomorrow).
		Count(&questionStats.CorrectToday)

	// 总体准确率
	var totalSessions, correctSessions int64
	database.DB.Model(&models.ReviewSession{}).Where("user_id = ?", userID).Count(&totalSessions)
	database.DB.Model(&models.ReviewSession{}).Where("user_id = ? AND is_correct = true", userID).Count(&correctSessions)

	if totalSessions > 0 {
		questionStats.OverallAccuracy = float64(correctSessions) / float64(totalSessions) * 100
	}

	stats["question_stats"] = questionStats

	// 获取各题型准确率
	typeAccuracy := make(map[string]float64)
	questionTypes := []string{"listening", "speaking", "reading", "writing"}

	for _, qType := range questionTypes {
		var typeTotal, typeCorrect int64
		database.DB.Model(&models.ReviewSession{}).
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.question_type = ?", userID, qType).
			Count(&typeTotal)

		database.DB.Model(&models.ReviewSession{}).
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.question_type = ? AND review_sessions.is_correct = true",
				userID, qType).
			Count(&typeCorrect)

		if typeTotal > 0 {
			typeAccuracy[qType+"_accuracy"] = float64(typeCorrect) / float64(typeTotal)
		} else {
			typeAccuracy[qType+"_accuracy"] = 0
		}
	}

	stats["type_accuracy"] = typeAccuracy

	// 获取最佳学习时间
	var bestTime struct {
		Hour     int
		Accuracy float64
	}

	database.DB.Raw(`
		SELECT
			EXTRACT(HOUR FROM created_at) as hour,
			AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy
		FROM review_sessions
		WHERE user_id = ?
		GROUP BY EXTRACT(HOUR FROM created_at)
		ORDER BY accuracy DESC
		LIMIT 1
	`, userID).Scan(&bestTime)

	timeSlot := "morning"
	if bestTime.Hour >= 12 && bestTime.Hour < 17 {
		timeSlot = "afternoon"
	} else if bestTime.Hour >= 17 {
		timeSlot = "evening"
	}

	stats["best_study_time"] = timeSlot
	stats["study_streak"] = user.Streak

	c.JSON(http.StatusOK, stats)
}

// GetProgress 获取用户学习进度
func (uc *UserController) GetProgress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 获取用户知识进度
	var knowledgeProgress []models.UserKnowledgeProgress
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Node").
		Find(&knowledgeProgress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch knowledge progress"})
		return
	}

	// 获取最近30天的学习进度
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var dailyProgress []struct {
		Date      string  `json:"date"`
		Sessions  int     `json:"sessions"`
		Correct   int     `json:"correct"`
		Accuracy  float64 `json:"accuracy"`
	}

	database.DB.Raw(`
		SELECT
			DATE(created_at) as date,
			COUNT(*) as sessions,
			SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
			AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy
		FROM review_sessions
		WHERE user_id = ? AND created_at >= ?
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`, userID, thirtyDaysAgo).Scan(&dailyProgress)

	// 获取成就进度
	var achievements []models.Achievement
	database.DB.Where("user_id = ?", userID).Find(&achievements)

	c.JSON(http.StatusOK, gin.H{
		"knowledge_progress": knowledgeProgress,
		"daily_progress":     dailyProgress,
		"achievements":       achievements,
		"total_nodes":        len(knowledgeProgress),
		"mastered_nodes":     countMasteredNodes(knowledgeProgress),
	})
}

// UpdateSettings 更新用户设置
func (uc *UserController) UpdateSettings(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		DailyGoal           int    `json:"daily_goal"`
		PreferredStudyTime  string `json:"preferred_study_time"`
		NotificationsEnabled bool   `json:"notifications_enabled"`
		SoundEnabled        bool   `json:"sound_enabled"`
		Theme               string `json:"theme"`
		Language            string `json:"language"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 这里可以创建用户设置表或者直接更新用户表
	// 为简化，我们创建一个设置表
	type UserSettings struct {
		UserID               string `gorm:"primaryKey"`
		DailyGoal           int    `gorm:"default:10"`
		PreferredStudyTime  string `gorm:"default:morning"`
		NotificationsEnabled bool   `gorm:"default:true"`
		SoundEnabled        bool   `gorm:"default:true"`
		Theme               string `gorm:"default:light"`
		Language            string `gorm:"default:zh-CN"`
		UpdatedAt           time.Time
	}

	// 自动迁移设置表
	database.DB.AutoMigrate(&UserSettings{})

	settings := UserSettings{
		UserID:               userID.(string),
		DailyGoal:           req.DailyGoal,
		PreferredStudyTime:  req.PreferredStudyTime,
		NotificationsEnabled: req.NotificationsEnabled,
		SoundEnabled:        req.SoundEnabled,
		Theme:               req.Theme,
		Language:            req.Language,
		UpdatedAt:           time.Now(),
	}

	// 使用 UPSERT 操作
	if err := database.DB.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Settings updated successfully",
		"settings": settings,
	})
}

// GetSettings 获取用户设置
func (uc *UserController) GetSettings(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	type UserSettings struct {
		UserID               string `gorm:"primaryKey"`
		DailyGoal           int    `gorm:"default:10"`
		PreferredStudyTime  string `gorm:"default:morning"`
		NotificationsEnabled bool   `gorm:"default:true"`
		SoundEnabled        bool   `gorm:"default:true"`
		Theme               string `gorm:"default:light"`
		Language            string `gorm:"default:zh-CN"`
		UpdatedAt           time.Time
	}

	var settings UserSettings
	err := database.DB.First(&settings, "user_id = ?", userID).Error

	if err != nil {
		// 如果没有设置记录，返回默认设置
		settings = UserSettings{
			UserID:               userID.(string),
			DailyGoal:           10,
			PreferredStudyTime:  "morning",
			NotificationsEnabled: true,
			SoundEnabled:        true,
			Theme:               "light",
			Language:            "zh-CN",
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"settings": settings,
	})
}

// countMasteredNodes 统计已掌握的知识节点数量
func countMasteredNodes(progress []models.UserKnowledgeProgress) int {
	count := 0
	for _, p := range progress {
		if p.MasteryLevel >= 0.8 { // 掌握度 >= 80% 视为已掌握
			count++
		}
	}
	return count
}