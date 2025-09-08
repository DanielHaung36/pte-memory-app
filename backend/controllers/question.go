package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	
	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
	"pte-memory-backend/websocket"
)

type QuestionController struct {
	ebbinghausService *services.EbbinghausService
	wsHub            *websocket.Hub
}

func NewQuestionController(wsHub *websocket.Hub) *QuestionController {
	return &QuestionController{
		ebbinghausService: services.NewEbbinghausService(),
		wsHub:            wsHub,
	}
}

type CreateQuestionRequest struct {
	Title           string                    `json:"title" binding:"required"`
	Content         string                    `json:"content" binding:"required"`
	QuestionType    models.QuestionType       `json:"question_type" binding:"required"`
	SubType         string                    `json:"sub_type"`
	CorrectAnswer   string                    `json:"correct_answer"`
	UserAnswer      string                    `json:"user_answer"`
	Explanation     string                    `json:"explanation"`
	DifficultyLevel models.DifficultyLevel    `json:"difficulty_level"`
	Tags            []string                  `json:"tags"`
	AudioURL        string                    `json:"audio_url"`
	ImageURL        string                    `json:"image_url"`
	TimeLimit       int                       `json:"time_limit"`
	Source          string                    `json:"source"`
}

// CreateQuestion creates a new question
func (qc *QuestionController) CreateQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": err.Error(),
		})
		return
	}

	// Create question
	question := models.Question{
		UserID:          userID,
		Title:           req.Title,
		Content:         req.Content,
		QuestionType:    req.QuestionType,
		SubType:         req.SubType,
		CorrectAnswer:   req.CorrectAnswer,
		UserAnswer:      req.UserAnswer,
		Explanation:     req.Explanation,
		DifficultyLevel: req.DifficultyLevel,
		Tags:            req.Tags,
		AudioURL:        req.AudioURL,
		ImageURL:        req.ImageURL,
		TimeLimit:       req.TimeLimit,
		Source:          req.Source,
		Points:          10, // Default points
	}

	if question.DifficultyLevel == 0 {
		question.DifficultyLevel = models.Medium
	}

	// Start transaction
	tx := database.DB.Begin()

	// Create question
	if err := tx.Create(&question).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	// Create initial review schedule
	schedule := qc.ebbinghausService.CreateInitialSchedule(userID, question.ID)
	if err := tx.Create(schedule).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review schedule"})
		return
	}

	// Create question stats
	stats := &models.QuestionStats{
		QuestionID: question.ID,
	}
	if err := tx.Create(stats).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question stats"})
		return
	}

	tx.Commit()

	// Load question with associations
	database.DB.Preload("ReviewSchedule").Preload("QuestionStats").First(&question, question.ID)

	// 发送WebSocket通知
	if qc.wsHub != nil {
		eventData := websocket.QuestionEventData{
			QuestionID:   question.ID,
			Title:        question.Title,
			QuestionType: string(question.QuestionType),
			Action:       "created",
		}
		qc.wsHub.SendToUser(userID, websocket.EventQuestionCreated, eventData)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Question created successfully",
		"question": question,
	})
}

// GetQuestions retrieves questions for the user
func (qc *QuestionController) GetQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Parse query parameters
	questionType := c.Query("type")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := database.DB.Preload("ReviewSchedule").Preload("QuestionStats").Where("user_id = ?", userID)

	if questionType != "" {
		query = query.Where("question_type = ?", questionType)
	}

	var questions []models.Question
	var total int64

	// Get total count
	query.Model(&models.Question{}).Count(&total)

	// Get questions with pagination
	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetReviewHistory retrieves user's review history for heatmap
func (qc *QuestionController) GetReviewHistory(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "365"))
	if days > 365 {
		days = 365
	}

	type ReviewHistoryItem struct {
		Date           string  `json:"date"`
		ReviewCount    int     `json:"review_count"`
		AccuracyRate   float64 `json:"accuracy_rate"`
		TimeSpent      int     `json:"time_spent"`
		StreakDay      bool    `json:"streak_day"`
		CompletedGoal  bool    `json:"completed_goal"`
	}

	var reviews []ReviewHistoryItem
	
	// 获取过去N天的复习数据，按日期分组统计
	err := database.DB.Table("review_sessions rs").
		Select(`
			DATE(rs.created_at) as date,
			COUNT(*) as review_count,
			AVG(CASE WHEN rs.is_correct THEN 100.0 ELSE 0.0 END) as accuracy_rate,
			COALESCE(SUM(rs.response_time), 0) / 1000 as time_spent,
			COUNT(*) >= 10 as streak_day,
			COUNT(*) >= 15 as completed_goal
		`).
		Where("rs.user_id = ? AND rs.created_at >= ?", userID, time.Now().AddDate(0, 0, -days)).
		Group("DATE(rs.created_at)").
		Order("date DESC").
		Scan(&reviews).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve review history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews": reviews,
		"days":    days,
	})
}

// GetQuestion retrieves a single question
func (qc *QuestionController) GetQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	questionID := c.Param("id")

	var question models.Question
	if err := database.DB.Preload("ReviewSchedule").Preload("QuestionStats").
		Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"question": question,
	})
}

// UpdateQuestion updates a question
func (qc *QuestionController) UpdateQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	questionID := c.Param("id")

	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	var req CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": err.Error(),
		})
		return
	}

	// Update question fields
	question.Title = req.Title
	question.Content = req.Content
	question.QuestionType = req.QuestionType
	question.SubType = req.SubType
	question.CorrectAnswer = req.CorrectAnswer
	question.UserAnswer = req.UserAnswer
	question.Explanation = req.Explanation
	question.DifficultyLevel = req.DifficultyLevel
	question.Tags = req.Tags
	question.AudioURL = req.AudioURL
	question.ImageURL = req.ImageURL
	question.TimeLimit = req.TimeLimit
	question.Source = req.Source

	if err := database.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	// Load updated question with associations
	database.DB.Preload("ReviewSchedule").Preload("QuestionStats").First(&question, question.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Question updated successfully",
		"question": question,
	})
}

// DeleteQuestion deletes a question
func (qc *QuestionController) DeleteQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	questionID := c.Param("id")

	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	// Soft delete
	if err := database.DB.Delete(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Question deleted successfully",
	})
}

// GetDueQuestions retrieves questions that are due for review
func (qc *QuestionController) GetDueQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	questions, err := models.GetNextReviewQuestions(database.DB, userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve due questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"count":     len(questions),
	})
}

// GetOverdueQuestions retrieves questions that are overdue for review
func (qc *QuestionController) GetOverdueQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	questions, err := models.GetOverdueQuestions(database.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve overdue questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"count":     len(questions),
	})
}

// GetQuestionsByType retrieves questions by type
func (qc *QuestionController) GetQuestionsByType(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	questionType := c.Param("type")
	
	questions, err := models.GetQuestionsByType(database.DB, userID, models.QuestionType(questionType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"count":     len(questions),
		"type":      questionType,
	})
}

// ReviewQuestion handles question review
func (qc *QuestionController) ReviewQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	type ReviewRequest struct {
		QuestionID      string  `json:"question_id" binding:"required"`
		IsCorrect       bool    `json:"is_correct"`
		ConfidenceLevel int     `json:"confidence_level"` // 1-5
		ResponseTime    int     `json:"response_time"`    // milliseconds
	}

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取问题和复习计划
	var question models.Question
	if err := database.DB.Preload("ReviewSchedule").Where("id = ? AND user_id = ?", req.QuestionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	// 更新复习计划
	reviewResult := services.ReviewResult{
		IsCorrect:       req.IsCorrect,
		ConfidenceLevel: req.ConfidenceLevel,
		ResponseTime:    req.ResponseTime,
		StreakCount:     0, // TODO: 从用户数据获取
	}
	
	newSchedule, err := qc.ebbinghausService.CalculateNextReview(question.ReviewSchedule, reviewResult)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate next review"})
		return
	}
	
	// 开始事务
	tx := database.DB.Begin()

	// 更新复习计划
	if err := tx.Save(newSchedule).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review schedule"})
		return
	}

	// 创建复习会话记录
	reviewSession := models.ReviewSession{
		UserID:          userID,
		QuestionID:      req.QuestionID,
		IsCorrect:       req.IsCorrect,
		ConfidenceLevel: req.ConfidenceLevel,
		ResponseTime:    req.ResponseTime,
	}

	if err := tx.Create(&reviewSession).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review session"})
		return
	}

	// 更新问题统计
	var stats models.QuestionStats
	tx.Where("question_id = ?", req.QuestionID).First(&stats)
	
	stats.TimesReviewed++
	if req.IsCorrect {
		stats.TimesCorrect++
		now := time.Now()
		stats.LastCorrectDate = &now
	} else {
		stats.TimesWrong++
		now := time.Now()
		stats.LastWrongDate = &now
	}
	
	// 计算准确率
	if stats.TimesReviewed > 0 {
		stats.AccuracyRate = float64(stats.TimesCorrect) / float64(stats.TimesReviewed) * 100
	}
	
	// 更新响应时间
	if req.ResponseTime > 0 {
		if stats.AverageResponseTime == 0 {
			stats.AverageResponseTime = req.ResponseTime
		} else {
			stats.AverageResponseTime = (stats.AverageResponseTime + req.ResponseTime) / 2
		}
		
		if stats.FastestResponseTime == 0 || req.ResponseTime < stats.FastestResponseTime {
			stats.FastestResponseTime = req.ResponseTime
		}
		
		if req.ResponseTime > stats.SlowestResponseTime {
			stats.SlowestResponseTime = req.ResponseTime
		}
	}

	if err := tx.Save(&stats).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question stats"})
		return
	}

	tx.Commit()

	// 发送WebSocket通知
	if qc.wsHub != nil {
		reviewResult := &websocket.ReviewResult{
			IsCorrect:       req.IsCorrect,
			ConfidenceLevel: req.ConfidenceLevel,
			ResponseTime:    req.ResponseTime,
			NextReviewDate:  newSchedule.NextReviewDate.Format(time.RFC3339),
			CurrentInterval: newSchedule.CurrentInterval,
			EaseFactor:      newSchedule.EaseFactor,
			RepetitionCount: newSchedule.RepetitionCount,
		}

		eventData := websocket.QuestionEventData{
			QuestionID:   req.QuestionID,
			Title:        question.Title,
			QuestionType: string(question.QuestionType),
			Action:       "reviewed",
			ReviewResult: reviewResult,
		}
		qc.wsHub.SendToUser(userID, websocket.EventQuestionReviewed, eventData)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Review completed successfully",
		"next_review":    newSchedule.NextReviewDate,
		"ease_factor":    newSchedule.EaseFactor,
		"interval":       newSchedule.CurrentInterval,
		"repetition":     newSchedule.RepetitionCount,
		"accuracy_rate":  stats.AccuracyRate,
	})
}

// BatchUpdateQuestions handles batch operations on questions
func (qc *QuestionController) BatchUpdateQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	type BatchRequest struct {
		QuestionIDs []string    `json:"question_ids" binding:"required,min=1"`
		Action      string      `json:"action" binding:"required"`
		Value       interface{} `json:"value,omitempty"`
	}

	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()
	var updatedCount int64

	switch req.Action {
	case "delete":
		result := tx.Where("user_id = ? AND id IN ?", userID, req.QuestionIDs).Delete(&models.Question{})
		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete questions"})
			return
		}
		updatedCount = result.RowsAffected

	case "update_priority":
		if priority, ok := req.Value.(float64); ok {
			result := tx.Model(&models.ReviewSchedule{}).
				Where("user_id = ? AND question_id IN ?", userID, req.QuestionIDs).
				Update("priority", int(priority))
			if result.Error != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update priority"})
				return
			}
			updatedCount = result.RowsAffected
		}

	case "add_tags":
		if tags, ok := req.Value.([]interface{}); ok {
			var tagStrings []string
			for _, tag := range tags {
				if tagStr, ok := tag.(string); ok {
					tagStrings = append(tagStrings, tagStr)
				}
			}
			
			// 添加标签到现有标签中（避免重复）
			var questions []models.Question
			tx.Where("user_id = ? AND id IN ?", userID, req.QuestionIDs).Find(&questions)
			
			for _, question := range questions {
				existingTags := question.Tags
				for _, newTag := range tagStrings {
					found := false
					for _, existingTag := range existingTags {
						if existingTag == newTag {
							found = true
							break
						}
					}
					if !found {
						existingTags = append(existingTags, newTag)
					}
				}
				tx.Model(&question).Update("tags", existingTags)
			}
			updatedCount = int64(len(questions))
		}

	default:
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "Batch operation completed successfully",
		"updated": updatedCount,
	})
}

// GetQuestionStatistics gets detailed statistics for questions
func (qc *QuestionController) GetQuestionStatistics(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	type QuestionStatsResponse struct {
		TotalQuestions    int64                          `json:"total_questions"`
		DueQuestions      int64                          `json:"due_questions"`
		OverdueQuestions  int64                          `json:"overdue_questions"`
		MasteredQuestions int64                          `json:"mastered_questions"`
		TodayReviewed     int64                          `json:"today_reviewed"`
		WeeklyReviewed    int64                          `json:"weekly_reviewed"`
		MonthlyReviewed   int64                          `json:"monthly_reviewed"`
		AverageAccuracy   float64                        `json:"average_accuracy"`
		TypeBreakdown     map[string]int                 `json:"type_breakdown"`
		DifficultyBreakdown map[string]int               `json:"difficulty_breakdown"`
		TagStats          map[string]int                 `json:"tag_stats"`
	}

	var stats QuestionStatsResponse
	
	// 总问题数
	database.DB.Model(&models.Question{}).Where("user_id = ?", userID).Count(&stats.TotalQuestions)
	
	// 待复习问题数
	database.DB.Model(&models.Question{}).
		Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
		Where("questions.user_id = ? AND rs.next_review_date <= ? AND rs.is_completed = false", 
			userID, time.Now()).
		Count(&stats.DueQuestions)
	
	// 逾期问题数
	database.DB.Model(&models.Question{}).
		Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
		Where("questions.user_id = ? AND rs.next_review_date < ? AND rs.is_completed = false", 
			userID, time.Now().AddDate(0, 0, -1)).
		Count(&stats.OverdueQuestions)
	
	// 已掌握问题数
	database.DB.Model(&models.Question{}).
		Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
		Where("questions.user_id = ? AND rs.is_mastered = true", userID).
		Count(&stats.MasteredQuestions)

	// 今日复习数
	today := time.Now().Format("2006-01-02")
	database.DB.Model(&models.ReviewSession{}).
		Where("user_id = ? AND DATE(created_at) = ?", userID, today).
		Count(&stats.TodayReviewed)

	// 本周复习数
	weekStart := time.Now().AddDate(0, 0, -int(time.Now().Weekday()))
	database.DB.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ?", userID, weekStart).
		Count(&stats.WeeklyReviewed)

	// 本月复习数  
	monthStart := time.Now().AddDate(0, 0, -time.Now().Day()+1)
	database.DB.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ?", userID, monthStart).
		Count(&stats.MonthlyReviewed)

	// 平均准确率
	var avgAccuracy struct {
		Avg float64
	}
	database.DB.Model(&models.QuestionStats{}).
		Joins("JOIN questions ON question_stats.question_id = questions.id").
		Where("questions.user_id = ?", userID).
		Select("AVG(accuracy_rate) as avg").
		Scan(&avgAccuracy)
	stats.AverageAccuracy = avgAccuracy.Avg

	// 类型分布
	stats.TypeBreakdown = make(map[string]int)
	var typeStats []struct {
		QuestionType string
		Count        int
	}
	database.DB.Model(&models.Question{}).
		Select("question_type, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("question_type").
		Scan(&typeStats)
	
	for _, ts := range typeStats {
		stats.TypeBreakdown[ts.QuestionType] = ts.Count
	}

	// 难度分布
	stats.DifficultyBreakdown = make(map[string]int)
	var diffStats []struct {
		DifficultyLevel int
		Count          int
	}
	database.DB.Model(&models.Question{}).
		Select("difficulty_level, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("difficulty_level").
		Scan(&diffStats)
	
	for _, ds := range diffStats {
		stats.DifficultyBreakdown[strconv.Itoa(ds.DifficultyLevel)] = ds.Count
	}

	// 标签统计
	stats.TagStats = make(map[string]int)
	var questions []models.Question
	database.DB.Select("tags").Where("user_id = ?", userID).Find(&questions)
	
	for _, question := range questions {
		for _, tag := range question.Tags {
			stats.TagStats[tag]++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"statistics": stats,
	})
}

// SearchQuestions searches questions with filters
func (qc *QuestionController) SearchQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// 查询参数
	searchTerm := c.Query("q")
	questionType := c.Query("type") 
	difficulty := c.Query("difficulty")
	tags := c.Query("tags")
	onlyDue := c.Query("only_due") == "true"
	onlyOverdue := c.Query("only_overdue") == "true"
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := database.DB.Preload("ReviewSchedule").Preload("QuestionStats").
		Where("user_id = ?", userID)

	// 搜索词
	if searchTerm != "" {
		query = query.Where("title ILIKE ? OR content ILIKE ?", "%"+searchTerm+"%", "%"+searchTerm+"%")
	}

	// 类型筛选
	if questionType != "" && questionType != "all" {
		query = query.Where("question_type = ?", questionType)
	}

	// 难度筛选
	if difficulty != "" && difficulty != "all" {
		query = query.Where("difficulty_level = ?", difficulty)
	}

	// 标签筛选
	if tags != "" {
		tagList := strings.Split(tags, ",")
		for _, tag := range tagList {
			query = query.Where("? = ANY(tags)", strings.TrimSpace(tag))
		}
	}

	// 只显示待复习的
	if onlyDue {
		query = query.Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
			Where("rs.next_review_date <= ? AND rs.is_completed = false", time.Now())
	}

	// 只显示逾期的
	if onlyOverdue {
		query = query.Joins("JOIN review_schedules rs ON questions.id = rs.question_id").
			Where("rs.next_review_date < ? AND rs.is_completed = false", time.Now().AddDate(0, 0, -1))
	}

	var total int64
	query.Model(&models.Question{}).Count(&total)

	// 排序
	var orderClause string
	switch sortBy {
	case "created_at", "updated_at", "difficulty_level":
		orderClause = sortBy + " " + strings.ToUpper(sortOrder)
	case "next_review_date":
		if onlyDue || onlyOverdue {
			orderClause = "rs.next_review_date " + strings.ToUpper(sortOrder)
		} else {
			orderClause = "created_at " + strings.ToUpper(sortOrder)
		}
	case "accuracy_rate":
		query = query.Joins("LEFT JOIN question_stats qs ON questions.id = qs.question_id")
		orderClause = "qs.accuracy_rate " + strings.ToUpper(sortOrder)
	default:
		orderClause = "created_at DESC"
	}

	var questions []models.Question
	if err := query.Order(orderClause).Limit(limit).Offset(offset).Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}