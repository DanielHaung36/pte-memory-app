package services

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"pte-memory-backend/models"
)

// ReviewPlanItem 复习计划项
type ReviewPlanItem struct {
	QuestionID   string
	Priority     int
	IsOverdue    bool
	IsWrong      bool
	Difficulty   int
	NextReview   time.Time
	Score        float64 // 综合评分，用于排序
}

// GenerateDailyReviewPlan 为用户生成每日复习计划
func GenerateDailyReviewPlan(db *gorm.DB, userID string) error {
	// 1. 获取所有到期的题目（基于SM-2算法）
	var dueSchedules []models.ReviewSchedule
	err := db.Where("user_id = ? AND next_review_date <= ? AND is_completed = false",
		userID, time.Now()).
		Order("priority DESC, next_review_date ASC").
		Find(&dueSchedules).Error

	if err != nil {
		return fmt.Errorf("failed to fetch due schedules: %w", err)
	}

	// 2. 优先级排序策略
	// - 逾期题目优先（next_review_date < 今天）
	// - 高优先级优先（priority DESC）
	// - 难度高的题目优先
	// - 错题优先

	var planItems []ReviewPlanItem

	for _, schedule := range dueSchedules {
		// 获取题目详情
		var question models.Question
		if err := db.First(&question, "id = ?", schedule.QuestionID).Error; err != nil {
			continue
		}

		// 检查是否为错题
		var wrongCount int64
		db.Model(&models.WrongQuestion{}).
			Where("user_id = ? AND question_id = ? AND is_resolved = false",
				userID, schedule.QuestionID).
			Count(&wrongCount)

		isOverdue := schedule.NextReviewDate.Before(time.Now().AddDate(0, 0, -1))
		isWrong := wrongCount > 0

		// 计算综合评分
		score := calculateReviewScore(
			schedule.Priority,
			isOverdue,
			isWrong,
			int(question.DifficultyLevel),
			schedule.NextReviewDate,
		)

		planItems = append(planItems, ReviewPlanItem{
			QuestionID: schedule.QuestionID,
			Priority:   schedule.Priority,
			IsOverdue:  isOverdue,
			IsWrong:    isWrong,
			Difficulty: int(question.DifficultyLevel),
			NextReview: schedule.NextReviewDate,
			Score:      score,
		})
	}

	// 3. 按综合评分排序
	sortReviewPlan(planItems)

	// 4. 生成今日复习计划（限制数量，避免过载）
	maxDailyReview := 50 // 每日最多复习50题
	if len(planItems) > maxDailyReview {
		planItems = planItems[:maxDailyReview]
	}

	// 5. 如果有计划项，发送提醒
	if len(planItems) > 0 {
		// 统计不同类型的题目数量
		overdueCount := 0
		wrongCount := 0

		for _, item := range planItems {
			if item.IsOverdue {
				overdueCount++
			}
			if item.IsWrong {
				wrongCount++
			}
		}

		// 发送综合提醒
		message := fmt.Sprintf("今日复习计划：共 %d 道题目", len(planItems))
		if overdueCount > 0 {
			message += fmt.Sprintf("（含 %d 道逾期题目）", overdueCount)
		}
		if wrongCount > 0 {
			message += fmt.Sprintf("（含 %d 道错题）", wrongCount)
		}

		SendNotification(userID, "daily_review_plan", "每日复习计划", message, "/review")
	}

	return nil
}

// calculateReviewScore 计算复习评分（分数越高优先级越高）
func calculateReviewScore(priority int, isOverdue bool, isWrong bool, difficulty int, nextReviewDate time.Time) float64 {
	score := 0.0

	// 基础优先级分数（1-5）
	score += float64(priority) * 10

	// 逾期惩罚（逾期越久分数越高）
	if isOverdue {
		daysOverdue := int(time.Since(nextReviewDate).Hours() / 24)
		score += float64(daysOverdue) * 5
	}

	// 错题加分
	if isWrong {
		score += 15
	}

	// 难度加分（难题优先）
	score += float64(difficulty) * 3

	return score
}

// sortReviewPlan 按评分排序复习计划
func sortReviewPlan(items []ReviewPlanItem) {
	// 简单的冒泡排序（因为数量不大）
	n := len(items)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if items[j].Score < items[j+1].Score {
				items[j], items[j+1] = items[j+1], items[j]
			}
		}
	}
}

// SendStreakBrokenNotification 发送连击中断通知
func SendStreakBrokenNotification(db *gorm.DB, userID string) error {
	return SendNotification(
		userID,
		"streak_broken",
		"连击中断",
		"你的学习连击已中断，但不要气馁！今天就重新开始吧！",
		"/dashboard",
	)
}

// CleanupExpiredNotifications 清理过期通知（提取为独立函数供调度器调用）
func CleanupExpiredNotifications(db *gorm.DB) error {
	now := time.Now()

	// 删除过期通知
	result := db.Where("expires_at < ?", now).Delete(&models.Notification{})
	if result.Error != nil {
		return result.Error
	}

	// 删除30天前已读的通知
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	result = db.Where("is_read = ? AND read_at < ?", true, thirtyDaysAgo).Delete(&models.Notification{})
	return result.Error
}

// GetDailyReviewPlan 获取用户今日复习计划
func GetDailyReviewPlan(db *gorm.DB, userID string) ([]models.Question, error) {
	// 获取到期的复习计划
	var schedules []models.ReviewSchedule
	err := db.Where("user_id = ? AND next_review_date <= ? AND is_completed = false",
		userID, time.Now()).
		Order("priority DESC, next_review_date ASC").
		Limit(50).
		Find(&schedules).Error

	if err != nil {
		return nil, err
	}

	// 提取题目ID
	questionIDs := make([]string, len(schedules))
	for i, schedule := range schedules {
		questionIDs[i] = schedule.QuestionID
	}

	// 获取题目详情
	var questions []models.Question
	err = db.Where("id IN ?", questionIDs).
		Preload("ReviewSchedule").
		Find(&questions).Error

	return questions, err
}

// UpdateReviewProgress 更新复习进度（完成复习后调用）
func UpdateReviewProgress(db *gorm.DB, userID string, questionID string, isCorrect bool, confidenceLevel int) error {
	// 1. 创建复习会话记录
	session := models.ReviewSession{
		UserID:          userID,
		QuestionID:      questionID,
		IsCorrect:       isCorrect,
		ConfidenceLevel: confidenceLevel,
		ReviewedAt:      time.Now(),
	}

	if err := db.Create(&session).Error; err != nil {
		return fmt.Errorf("failed to create review session: %w", err)
	}

	// 2. 获取复习计划
	var schedule models.ReviewSchedule
	err := db.Where("user_id = ? AND question_id = ?", userID, questionID).
		First(&schedule).Error

	if err != nil {
		return fmt.Errorf("failed to fetch review schedule: %w", err)
	}

	// 3. 使用 SM-2 算法更新复习间隔
	ebbinghausService := NewEbbinghausService()

	// 创建 ReviewResult
	reviewResult := ReviewResult{
		IsCorrect:       isCorrect,
		ConfidenceLevel: confidenceLevel,
		ResponseTime:    session.ResponseTime,
	}

	// 计算新的复习计划
	newSchedule, err := ebbinghausService.CalculateNextReview(&schedule, reviewResult)
	if err != nil {
		return fmt.Errorf("failed to calculate next review: %w", err)
	}

	// 4. 更新复习计划（使用新计算的值）
	schedule.CurrentInterval = newSchedule.CurrentInterval
	schedule.EaseFactor = newSchedule.EaseFactor
	schedule.NextReviewDate = newSchedule.NextReviewDate
	schedule.LastReviewDate = newSchedule.LastReviewDate
	schedule.RepetitionCount = newSchedule.RepetitionCount
	schedule.Priority = newSchedule.Priority
	schedule.IsMastered = newSchedule.IsMastered

	// 检查是否已掌握（连续答对5次且置信度高）
	if schedule.RepetitionCount >= 5 && schedule.EaseFactor > 2.0 {
		var recentSessions []models.ReviewSession
		db.Where("user_id = ? AND question_id = ?", userID, questionID).
			Order("created_at DESC").
			Limit(5).
			Find(&recentSessions)

		allCorrect := true
		for _, s := range recentSessions {
			if !s.IsCorrect {
				allCorrect = false
				break
			}
		}

		if allCorrect {
			schedule.IsMastered = true
		}
	}

	if err := db.Save(&schedule).Error; err != nil {
		return fmt.Errorf("failed to update review schedule: %w", err)
	}

	// 5. 如果答错了，添加到错题本
	if !isCorrect {
		var question models.Question
		if err := db.First(&question, "id = ?", questionID).Error; err == nil {
			// 检查是否已存在错题记录
			var existingWrong models.WrongQuestion
			err := db.Where("user_id = ? AND question_id = ?", userID, questionID).
				First(&existingWrong).Error

			if err == gorm.ErrRecordNotFound {
				// 创建新的错题记录
				wrongQuestion := models.WrongQuestion{
					UserID:        userID,
					QuestionID:    questionID,
					CorrectAnswer: question.CorrectAnswer,
					TimesWrong:    1,
					LastWrongAt:   time.Now(),
					Priority:      int(question.DifficultyLevel),
				}
				db.Create(&wrongQuestion)
			} else {
				// 更新现有错题记录
				existingWrong.TimesWrong++
				existingWrong.LastWrongAt = time.Now()
				existingWrong.IsResolved = false
				db.Save(&existingWrong)
			}
		}
	}

	return nil
}
