package controllers

import (
	"net/http"
	"strconv"
	"time"
	
	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"
	"pte-memory-backend/websocket"
)

type WrongQuestionController struct {
	wsHub *websocket.Hub
}

func NewWrongQuestionController(wsHub *websocket.Hub) *WrongQuestionController {
	return &WrongQuestionController{
		wsHub: wsHub,
	}
}

type CreateWrongQuestionRequest struct {
	QuestionID    string   `json:"question_id" binding:"required"`
	UserAnswer    string   `json:"user_answer"`
	CorrectAnswer string   `json:"correct_answer"`
	ErrorType     string   `json:"error_type"`
	ErrorReason   string   `json:"error_reason"`
	Difficulty    int      `json:"difficulty"`
	Notes         string   `json:"notes"`
	Priority      int      `json:"priority"`
	Tags          []string `json:"tags"`
}

// CreateWrongQuestion 创建错题记录
func (wqc *WrongQuestionController) CreateWrongQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	var req CreateWrongQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "参数验证失败",
			"message": err.Error(),
		})
		return
	}

	// 检查问题是否存在
	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", req.QuestionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "问题未找到"})
		return
	}

	// 检查是否已存在该错题记录
	var existingWrong models.WrongQuestion
	result := database.DB.Where("user_id = ? AND question_id = ? AND is_resolved = false", userID, req.QuestionID).First(&existingWrong)
	
	if result.Error == nil {
		// 更新现有记录
		existingWrong.TimesWrong++
		existingWrong.LastWrongAt = time.Now()
		existingWrong.UserAnswer = req.UserAnswer
		existingWrong.ErrorReason = req.ErrorReason
		existingWrong.Notes = req.Notes
		
		if err := database.DB.Save(&existingWrong).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新错题记录失败"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"message": "错题记录已更新",
			"wrong_question": existingWrong,
		})
		return
	}

	// 创建新的错题记录
	wrongQuestion := models.WrongQuestion{
		UserID:        userID,
		QuestionID:    req.QuestionID,
		UserAnswer:    req.UserAnswer,
		CorrectAnswer: req.CorrectAnswer,
		ErrorType:     req.ErrorType,
		ErrorReason:   req.ErrorReason,
		Difficulty:    req.Difficulty,
		Notes:         req.Notes,
		Priority:      req.Priority,
		Tags:          models.StringArray(req.Tags),
		LastWrongAt:   time.Now(),
	}

	if wrongQuestion.Difficulty == 0 {
		wrongQuestion.Difficulty = 1
	}
	if wrongQuestion.Priority == 0 {
		wrongQuestion.Priority = 1
	}

	if err := database.DB.Create(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建错题记录失败"})
		return
	}

	// 加载关联数据
	database.DB.Preload("Question").First(&wrongQuestion, wrongQuestion.ID)

	// 发送WebSocket通知
	if wqc.wsHub != nil {
		eventData := map[string]interface{}{
			"wrong_question_id": wrongQuestion.ID,
			"question_title":    question.Title,
			"error_type":        wrongQuestion.ErrorType,
			"action":           "created",
		}
		wqc.wsHub.SendToUser(userID, "wrong_question_created", eventData)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "错题记录创建成功",
		"wrong_question": wrongQuestion,
	})
}

// GetWrongQuestions 获取错题列表
func (wqc *WrongQuestionController) GetWrongQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	// 解析查询参数
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	errorType := c.Query("error_type")
	isResolved := c.Query("is_resolved")
	priority := c.Query("priority")

	query := database.DB.Preload("Question").Where("user_id = ?", userID)

	// 按错误类型筛选
	if errorType != "" {
		query = query.Where("error_type = ?", errorType)
	}

	// 按解决状态筛选
	if isResolved != "" {
		resolved, _ := strconv.ParseBool(isResolved)
		query = query.Where("is_resolved = ?", resolved)
	}

	// 按优先级筛选
	if priority != "" {
		p, _ := strconv.Atoi(priority)
		query = query.Where("priority = ?", p)
	}

	var wrongQuestions []models.WrongQuestion
	var total int64

	// 获取总数
	query.Model(&models.WrongQuestion{}).Count(&total)

	// 分页查询
	if err := query.Limit(limit).Offset(offset).Order("priority DESC, created_at DESC").Find(&wrongQuestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取错题列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"wrong_questions": wrongQuestions,
		"total":           total,
		"limit":           limit,
		"offset":          offset,
	})
}

// GetWrongQuestion 获取单个错题详情
func (wqc *WrongQuestionController) GetWrongQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	wrongQuestionID := c.Param("id")

	var wrongQuestion models.WrongQuestion
	if err := database.DB.Preload("Question").Where("id = ? AND user_id = ?", wrongQuestionID, userID).First(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "错题记录未找到"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"wrong_question": wrongQuestion,
	})
}

// UpdateWrongQuestion 更新错题记录
func (wqc *WrongQuestionController) UpdateWrongQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	wrongQuestionID := c.Param("id")

	var wrongQuestion models.WrongQuestion
	if err := database.DB.Where("id = ? AND user_id = ?", wrongQuestionID, userID).First(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "错题记录未找到"})
		return
	}

	type UpdateRequest struct {
		ErrorReason string   `json:"error_reason"`
		Notes       string   `json:"notes"`
		Priority    int      `json:"priority"`
		Tags        []string `json:"tags"`
		IsResolved  *bool    `json:"is_resolved"`
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "参数验证失败",
			"message": err.Error(),
		})
		return
	}

	// 更新字段
	if req.ErrorReason != "" {
		wrongQuestion.ErrorReason = req.ErrorReason
	}
	if req.Notes != "" {
		wrongQuestion.Notes = req.Notes
	}
	if req.Priority > 0 {
		wrongQuestion.Priority = req.Priority
	}
	if len(req.Tags) > 0 {
		wrongQuestion.Tags = models.StringArray(req.Tags)
	}
	if req.IsResolved != nil {
		wrongQuestion.IsResolved = *req.IsResolved
		if *req.IsResolved {
			now := time.Now()
			wrongQuestion.ResolvedAt = &now
		}
	}

	if err := database.DB.Save(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新错题记录失败"})
		return
	}

	// 加载更新后的数据
	database.DB.Preload("Question").First(&wrongQuestion, wrongQuestion.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "错题记录更新成功",
		"wrong_question": wrongQuestion,
	})
}

// DeleteWrongQuestion 删除错题记录
func (wqc *WrongQuestionController) DeleteWrongQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	wrongQuestionID := c.Param("id")

	var wrongQuestion models.WrongQuestion
	if err := database.DB.Where("id = ? AND user_id = ?", wrongQuestionID, userID).First(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "错题记录未找到"})
		return
	}

	// 软删除
	if err := database.DB.Delete(&wrongQuestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除错题记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "错题记录删除成功",
	})
}

// GetWrongQuestionStats 获取错题统计信息
func (wqc *WrongQuestionController) GetWrongQuestionStats(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	stats, err := models.GetWrongQuestionStats(database.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取错题统计失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// BatchUpdateWrongQuestions 批量更新错题
func (wqc *WrongQuestionController) BatchUpdateWrongQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	type BatchRequest struct {
		WrongQuestionIDs []string    `json:"wrong_question_ids" binding:"required,min=1"`
		Action           string      `json:"action" binding:"required"`
		Value            interface{} `json:"value,omitempty"`
	}

	var req BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()
	var updatedCount int64

	switch req.Action {
	case "resolve":
		// 批量标记为已解决
		result := tx.Model(&models.WrongQuestion{}).
			Where("user_id = ? AND id IN ?", userID, req.WrongQuestionIDs).
			Updates(map[string]interface{}{
				"is_resolved": true,
				"resolved_at": time.Now(),
			})
		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "批量解决失败"})
			return
		}
		updatedCount = result.RowsAffected

	case "update_priority":
		// 批量更新优先级
		if priority, ok := req.Value.(float64); ok {
			result := tx.Model(&models.WrongQuestion{}).
				Where("user_id = ? AND id IN ?", userID, req.WrongQuestionIDs).
				Update("priority", int(priority))
			if result.Error != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "批量更新优先级失败"})
				return
			}
			updatedCount = result.RowsAffected
		}

	case "delete":
		// 批量删除
		result := tx.Where("user_id = ? AND id IN ?", userID, req.WrongQuestionIDs).Delete(&models.WrongQuestion{})
		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "批量删除失败"})
			return
		}
		updatedCount = result.RowsAffected

	default:
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的操作类型"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "批量操作完成",
		"updated": updatedCount,
	})
}

// SearchWrongQuestions 搜索错题
func (wqc *WrongQuestionController) SearchWrongQuestions(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	// 搜索参数
	searchTerm := c.Query("q")
	errorType := c.Query("error_type")
	priority := c.Query("priority")
	isResolved := c.Query("is_resolved")
	tags := c.Query("tags")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := database.DB.Preload("Question").Where("user_id = ?", userID)

	// 搜索词
	if searchTerm != "" {
		query = query.Where("error_reason ILIKE ? OR notes ILIKE ?", "%"+searchTerm+"%", "%"+searchTerm+"%")
	}

	// 错误类型筛选
	if errorType != "" && errorType != "all" {
		query = query.Where("error_type = ?", errorType)
	}

	// 优先级筛选
	if priority != "" && priority != "all" {
		p, _ := strconv.Atoi(priority)
		query = query.Where("priority = ?", p)
	}

	// 解决状态筛选
	if isResolved != "" && isResolved != "all" {
		resolved, _ := strconv.ParseBool(isResolved)
		query = query.Where("is_resolved = ?", resolved)
	}

	// 标签筛选
	if tags != "" {
		query = query.Where("? = ANY(tags)", tags)
	}

	var total int64
	query.Model(&models.WrongQuestion{}).Count(&total)

	// 排序
	var orderClause string
	switch sortBy {
	case "created_at", "updated_at", "priority", "times_wrong":
		orderClause = sortBy + " " + sortOrder
	default:
		orderClause = "created_at DESC"
	}

	var wrongQuestions []models.WrongQuestion
	if err := query.Order(orderClause).Limit(limit).Offset(offset).Find(&wrongQuestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "搜索错题失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"wrong_questions": wrongQuestions,
		"total":           total,
		"limit":           limit,
		"offset":          offset,
	})
}