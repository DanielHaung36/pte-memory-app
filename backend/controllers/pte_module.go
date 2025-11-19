package controllers

import (
	"net/http"
	"strconv"
	"time"

	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"

	"github.com/gin-gonic/gin"
)

type PTEModuleController struct{}

func NewPTEModuleController() *PTEModuleController {
	return &PTEModuleController{}
}

// GetAllModules 获取所有PTE模块
func (pmc *PTEModuleController) GetAllModules(c *gin.Context) {
	modules, err := models.GetAllModules(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取模块失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"modules": modules,
		"count":   len(modules),
	})
}

// GetModuleByCode 根据代码获取模块详情
func (pmc *PTEModuleController) GetModuleByCode(c *gin.Context) {
	code := c.Param("code")

	module, err := models.GetModuleByCode(database.DB, code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "模块不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"module": module,
	})
}

// GetQuestionTypesByModule 获取模块下的所有题型
func (pmc *PTEModuleController) GetQuestionTypesByModule(c *gin.Context) {
	moduleID := c.Param("module_id")

	questionTypes, err := models.GetQuestionTypesByModule(database.DB, moduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题型失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"question_types": questionTypes,
		"count":          len(questionTypes),
	})
}

// GetQuestionTypeByCode 根据代码获取题型详情
func (pmc *PTEModuleController) GetQuestionTypeByCode(c *gin.Context) {
	code := c.Param("code")

	questionType, err := models.GetQuestionTypeByCode(database.DB, code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题型不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"question_type": questionType,
	})
}

// GetUserModuleStats 获取用户的模块统计
func (pmc *PTEModuleController) GetUserModuleStats(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	moduleID := c.Param("module_id")

	stats, err := models.GetUserModuleStats(database.DB, userID, moduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取统计失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// GetUserAllModuleStats 获取用户所有模块的统计
func (pmc *PTEModuleController) GetUserAllModuleStats(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	var stats []models.PTEModuleStats
	err := database.DB.Preload("Module").
		Where("user_id = ?", userID).
		Find(&stats).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取统计失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
		"count": len(stats),
	})
}

// GetUserQuestionTypeStats 获取用户的题型统计
func (pmc *PTEModuleController) GetUserQuestionTypeStats(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	questionTypeID := c.Param("question_type_id")

	stats, err := models.GetUserQuestionTypeStats(database.DB, userID, questionTypeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取统计失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// StartPracticeSession 开始练习会话
type StartPracticeSessionRequest struct {
	QuestionTypeID string `json:"question_type_id" binding:"required"`
	Mode           string `json:"mode" binding:"required"` // "practice" or "exam"
	QuestionCount  int    `json:"question_count" binding:"required,min=1,max=50"`
}

// PracticeSession 练习会话
type PracticeSession struct {
	ID             string                 `json:"id"`
	UserID         string                 `json:"user_id"`
	QuestionTypeID string                 `json:"question_type_id"`
	Mode           string                 `json:"mode"`
	Questions      []models.Question      `json:"questions"`
	StartTime      time.Time              `json:"start_time"`
	EndTime        *time.Time             `json:"end_time"`
	TotalQuestions int                    `json:"total_questions"`
	CorrectAnswers int                    `json:"correct_answers"`
	Score          float64                `json:"score"`
}

// StartPracticeSession 开始练习会话
func (pmc *PTEModuleController) StartPracticeSession(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	var req StartPracticeSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 获取题型信息
	var questionType models.PTEQuestionType
	if err := database.DB.First(&questionType, "id = ?", req.QuestionTypeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题型不存在"})
		return
	}

	// 获取题目
	var questions []models.Question
	query := database.DB.Where("user_id = ? AND sub_type = ?", userID, questionType.Code)

	// 根据模式选择题目
	if req.Mode == "exam" {
		// 考试模式：随机选择题目
		query = query.Order("RANDOM()")
	} else {
		// 练习模式：优先选择错题和待复习的题目
		query = query.Joins("LEFT JOIN wrong_questions wq ON questions.id = wq.question_id AND wq.user_id = ?", userID).
			Joins("LEFT JOIN review_schedules rs ON questions.id = rs.question_id").
			Order("CASE WHEN wq.is_resolved = false THEN 1 WHEN rs.next_review_date <= NOW() THEN 2 ELSE 3 END, RANDOM()")
	}

	if err := query.Limit(req.QuestionCount).Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题目失败"})
		return
	}

	if len(questions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "没有可用的题目"})
		return
	}

	// 创建会话（这里简化处理，实际应该存储在数据库中）
	session := PracticeSession{
		ID:             "session_" + time.Now().Format("20060102150405"),
		UserID:         userID,
		QuestionTypeID: req.QuestionTypeID,
		Mode:           req.Mode,
		Questions:      questions,
		StartTime:      time.Now(),
		TotalQuestions: len(questions),
	}

	c.JSON(http.StatusOK, gin.H{
		"session": session,
		"message": "练习会话开始",
	})
}

// SubmitPracticeAnswer 提交练习答案
type SubmitPracticeAnswerRequest struct {
	SessionID      string  `json:"session_id" binding:"required"`
	QuestionID     string  `json:"question_id" binding:"required"`
	UserAnswer     string  `json:"user_answer"`
	IsCorrect      bool    `json:"is_correct"`
	ResponseTime   int     `json:"response_time"` // 毫秒
	ConfidenceLevel int    `json:"confidence_level"` // 1-5
	Score          float64 `json:"score"` // 0-100
}

// SubmitPracticeAnswer 提交练习答案
func (pmc *PTEModuleController) SubmitPracticeAnswer(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	var req SubmitPracticeAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 获取题目
	var question models.Question
	if err := database.DB.Preload("ReviewSchedule").
		First(&question, "id = ? AND user_id = ?", req.QuestionID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	tx := database.DB.Begin()

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建记录失败"})
		return
	}

	// 如果答错了，自动添加到错题本
	if !req.IsCorrect {
		var existingWrong models.WrongQuestion
		result := tx.Where("user_id = ? AND question_id = ? AND is_resolved = false", userID, req.QuestionID).
			First(&existingWrong)

		if result.Error != nil {
			// 创建新的错题记录
			wrongQuestion := models.WrongQuestion{
				UserID:        userID,
				QuestionID:    req.QuestionID,
				UserAnswer:    req.UserAnswer,
				CorrectAnswer: question.CorrectAnswer,
				ErrorType:     "practice_error",
				Difficulty:    int(question.DifficultyLevel),
				Priority:      3, // 默认优先级
				LastWrongAt:   time.Now(),
			}
			tx.Create(&wrongQuestion)
		} else {
			// 更新现有错题记录
			existingWrong.TimesWrong++
			existingWrong.UserAnswer = req.UserAnswer
			existingWrong.LastWrongAt = time.Now()
			tx.Save(&existingWrong)
		}
	}

	// 更新题型统计
	var questionType models.PTEQuestionType
	if err := tx.Where("code = ?", question.SubType).First(&questionType).Error; err == nil {
		stats, _ := models.GetUserQuestionTypeStats(tx, userID, questionType.ID)
		if stats != nil {
			stats.UpdateStats(tx, req.IsCorrect, req.ResponseTime/1000, req.Score)
		}

		// 更新模块统计
		moduleStats, _ := models.GetUserModuleStats(tx, userID, questionType.ModuleID)
		if moduleStats != nil {
			moduleStats.UpdateStats(tx, req.IsCorrect, req.ResponseTime/1000)
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":    "答案提交成功",
		"is_correct": req.IsCorrect,
	})
}

// GetQuestionsByType 根据题型获取题目列表
func (pmc *PTEModuleController) GetQuestionsByType(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	typeCode := c.Param("type_code")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var questions []models.Question
	query := database.DB.Preload("ReviewSchedule").
		Preload("QuestionStats").
		Where("user_id = ? AND sub_type = ?", userID, typeCode)

	var total int64
	query.Model(&models.Question{}).Count(&total)

	if err := query.Limit(limit).Offset(offset).
		Order("created_at DESC").
		Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetModuleOverview 获取模块概览（包含统计数据）
func (pmc *PTEModuleController) GetModuleOverview(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	// 获取所有模块
	modules, err := models.GetAllModules(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取模块失败"})
		return
	}

	// 为每个模块添加统计数据
	type ModuleOverview struct {
		Module models.PTEModule       `json:"module"`
		Stats  *models.PTEModuleStats `json:"stats"`
	}

	var overview []ModuleOverview
	for _, module := range modules {
		stats, _ := models.GetUserModuleStats(database.DB, userID, module.ID)
		overview = append(overview, ModuleOverview{
			Module: module,
			Stats:  stats,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"overview": overview,
		"count":    len(overview),
	})
}
