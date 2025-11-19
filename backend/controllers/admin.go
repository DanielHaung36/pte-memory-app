package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==================== 用户管理 ====================

// GetAllUsers 获取所有用户列表（管理员）
// GET /api/admin/users?page=1&limit=20&status=active&search=keyword
func GetAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")     // active, banned
	search := c.Query("search")     // 搜索用户名或邮箱
	orderBy := c.DefaultQuery("order_by", "created_at DESC")

	offset := (page - 1) * limit

	query := database.DB.Model(&models.User{})

	// 筛选条件
	if status == "banned" {
		query = query.Where("is_banned = ?", true)
	} else if status == "active" {
		query = query.Where("is_banned = ?", false)
	}

	if search != "" {
		query = query.Where("username LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// 总数
	var total int64
	query.Count(&total)

	// 分页查询
	var users []models.User
	err := query.Order(orderBy).Limit(limit).Offset(offset).Find(&users).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"total":        total,
			"page":         page,
			"limit":        limit,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetUserDetail 获取用户详细信息（管理员）
// GET /api/admin/users/:id
func GetUserDetail(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 获取用户统计数据
	var questionCount, reviewCount int64
	database.DB.Model(&models.Question{}).Where("user_id = ?", userID).Count(&questionCount)
	database.DB.Model(&models.ReviewSession{}).Where("user_id = ?", userID).Count(&reviewCount)

	// 获取最近登录记录
	var adminLogs []models.AdminLog
	database.DB.Where("target_id = ? AND action IN ?", userID, []string{"user_login", "user_logout"}).
		Order("created_at DESC").
		Limit(10).
		Find(&adminLogs)

	c.JSON(http.StatusOK, gin.H{
		"user":            user,
		"question_count":  questionCount,
		"review_count":    reviewCount,
		"recent_logins":   adminLogs,
	})
}

// BanUser 封禁用户（管理员）
// POST /api/admin/users/:id/ban
func BanUser(c *gin.Context) {
	adminID := c.GetString("user_id") // 从中间件获取管理员ID
	userID := c.Param("id")

	var input struct {
		Reason     string `json:"reason" binding:"required"`
		BanUntil   *time.Time `json:"ban_until"` // 永久封禁则为nil
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.IsBanned {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户已被封禁"})
		return
	}

	tx := database.DB.Begin()

	// 更新用户状态
	updates := map[string]interface{}{
		"is_banned":  true,
		"ban_reason": input.Reason,
	}
	if input.BanUntil != nil {
		updates["ban_until"] = input.BanUntil
	}

	if err := tx.Model(&user).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "封禁失败"})
		return
	}

	// 记录管理员操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "user_ban",
		TargetType: "user",
		TargetID:   userID,
		Description:    input.Reason,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "用户已封禁",
		"user":    user,
	})
}

// UnbanUser 解封用户（管理员）
// POST /api/admin/users/:id/unban
func UnbanUser(c *gin.Context) {
	adminID := c.GetString("user_id")
	userID := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if !user.IsBanned {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户未被封禁"})
		return
	}

	tx := database.DB.Begin()

	// 解封用户
	updates := map[string]interface{}{
		"is_banned":  false,
		"ban_reason": "",
		"ban_until":  nil,
	}

	if err := tx.Model(&user).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "解封失败"})
		return
	}

	// 记录操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "user_unban",
		TargetType: "user",
		TargetID:   userID,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "用户已解封",
		"user":    user,
	})
}

// UpdateUserRole 修改用户角色（超级管理员）
// PUT /api/admin/users/:id/role
func UpdateUserRole(c *gin.Context) {
	adminID := c.GetString("user_id")
	userID := c.Param("id")

	var input struct {
		Level int `json:"level" binding:"required,min=1,max=5"`
		XP    int `json:"xp"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	tx := database.DB.Begin()

	// 更新等级和经验值
	updates := map[string]interface{}{
		"level": input.Level,
	}
	if input.XP > 0 {
		updates["xp"] = input.XP
	}

	if err := tx.Model(&user).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	// 记录操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "user_update_role",
		TargetType: "user",
		TargetID:   userID,
		Description:    "Level: " + strconv.Itoa(input.Level),
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "用户信息已更新",
		"user":    user,
	})
}

// ==================== 题目审核 ====================

// GetPendingQuestions 获取待审核题目列表
// GET /api/admin/questions/pending?page=1&limit=20
func GetPendingQuestions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query := database.DB.Where("verification_status = ?", "pending")

	var total int64
	query.Model(&models.Question{}).Count(&total)

	var questions []models.Question
	err := query.
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&questions).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取待审核题目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ApproveQuestion 批准题目（管理员）
// POST /api/admin/questions/:id/approve
func ApproveQuestion(c *gin.Context) {
	adminID := c.GetString("user_id")
	questionID := c.Param("id")

	var input struct {
		Comment string `json:"comment"`
	}
	c.ShouldBindJSON(&input)

	var question models.Question
	if err := database.DB.First(&question, "id = ?", questionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	if question.VerificationStatus == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "题目已审核通过"})
		return
	}

	tx := database.DB.Begin()

	// 更新题目状态
	updates := map[string]interface{}{
		"verification_status": "approved",
		"verified_by":         adminID,
		"is_free_question":    true, // 审核通过后加入免费题库
	}
	if err := tx.Model(&question).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "审核失败"})
		return
	}

	// 创建审核记录
	review := models.QuestionReview{
		QuestionID: questionID,

		Status:     "approved",
		Reason:    input.Comment,
	}
	tx.Create(&review)

	// 奖励贡献者（50 XP）
	var user models.User
	tx.First(&user, "id = ?", question.UserID)
	user.AddXP(50)
	tx.Save(&user)

	// 记录操作日志
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "question_approve",
		TargetType: "question",
		TargetID:   questionID,
		Description:    input.Comment,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":  "题目已批准",
		"question": question,
	})
}

// RejectQuestion 拒绝题目（管理员）
// POST /api/admin/questions/:id/reject
func RejectQuestion(c *gin.Context) {
	adminID := c.GetString("user_id")
	questionID := c.Param("id")

	var input struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供拒绝原因"})
		return
	}

	var question models.Question
	if err := database.DB.First(&question, "id = ?", questionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	tx := database.DB.Begin()

	// 更新题目状态
	updates := map[string]interface{}{
		"verification_status": "rejected",
		"verified_by":         adminID,
	}
	if err := tx.Model(&question).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}

	// 创建审核记录
	review := models.QuestionReview{
		QuestionID: questionID,

		Status:     "rejected",
		Reason:    input.Reason,
	}
	tx.Create(&review)

	// 记录操作日志
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "question_reject",
		TargetType: "question",
		TargetID:   questionID,
		Description:    input.Reason,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":  "题目已拒绝",
		"question": question,
	})
}

// BatchReviewQuestions 批量审核题目
// POST /api/admin/questions/batch-review
func BatchReviewQuestions(c *gin.Context) {
	adminID := c.GetString("user_id")

	var input struct {
		QuestionIDs []string `json:"question_ids" binding:"required"`
		Action      string   `json:"action" binding:"required,oneof=approve reject"`
		Comment     string   `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	status := input.Action + "d" // approved/rejected
	successCount := 0

	for _, questionID := range input.QuestionIDs {
		var question models.Question
		if err := tx.First(&question, "id = ?", questionID).Error; err != nil {
			continue
		}

		// 更新状态
		updates := map[string]interface{}{
			"verification_status": status,
			"verified_by":         adminID,
		}
		if input.Action == "approve" {
			updates["is_free_question"] = true
		}

		tx.Model(&question).Updates(updates)

		// 创建审核记录
		review := models.QuestionReview{
			QuestionID: questionID,
			ReviewerID:    adminID,
			Status:     status,
			Reason:    input.Comment,
		}
		tx.Create(&review)

		// 如果批准，奖励贡献者
		if input.Action == "approve" {
			var user models.User
			tx.First(&user, "id = ?", question.UserID)
			user.AddXP(50)
			tx.Save(&user)
		}

		successCount++
	}

	// 记录批量操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "question_batch_" + input.Action,
		TargetType: "question",
		Description:    "Processed " + strconv.Itoa(successCount) + " questions",
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "批量审核完成",
		"count":   successCount,
	})
}

// ==================== 举报处理 ====================

// GetUserReports 获取用户举报列表
// GET /api/admin/reports?status=pending&type=question&page=1&limit=20
func GetUserReports(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")       // pending, resolved, dismissed
	reportType := c.Query("type")     // question, user, post

	offset := (page - 1) * limit

	query := database.DB.Model(&models.UserReport{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if reportType != "" {
		query = query.Where("report_type = ?", reportType)
	}

	var total int64
	query.Count(&total)

	var reports []models.UserReport
	err := query.
		Preload("Reporter").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reports).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取举报列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reports": reports,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ProcessReport 处理举报
// POST /api/admin/reports/:id/process
func ProcessReport(c *gin.Context) {
	adminID := c.GetString("user_id")
	reportID := c.Param("id")

	var input struct {
		Action   string `json:"action" binding:"required,oneof=resolve dismiss"`
		Comment  string `json:"comment"`
		BanUser  bool   `json:"ban_user"`  // 是否封禁被举报用户
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var report models.UserReport
	if err := database.DB.First(&report, "id = ?", reportID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "举报不存在"})
		return
	}

	if report.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "举报已处理"})
		return
	}

	tx := database.DB.Begin()

	// 更新举报状态
	updates := map[string]interface{}{
		"status":       input.Action + "d", // resolved/dismissed
		"processed_by": adminID,
		"processed_at": time.Now(),
		"admin_note":   input.Comment,
	}

	if err := tx.Model(&report).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "处理失败"})
		return
	}

	// 如果需要封禁用户
	if input.BanUser && input.Action == "resolve" && report.TargetType == "user" {
		var user models.User
		tx.First(&user, "id = ?", report.TargetID)
		tx.Model(&user).Updates(map[string]interface{}{
			"is_banned":  true,
			"ban_reason": "Violation reported: " + report.Reason,
		})
	}

	// 记录操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "report_" + input.Action,
		TargetType: "report",
		TargetID:   reportID,
		Description:    input.Comment,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "举报已处理",
		"report":  report,
	})
}

// ==================== 系统配置 ====================

// GetSystemConfigs 获取系统配置
// GET /api/admin/configs?category=general
func GetSystemConfigs(c *gin.Context) {
	category := c.Query("category")

	query := database.DB.Model(&models.SystemConfig{})
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var configs []models.SystemConfig
	if err := query.Order("category, key").Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取配置失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"configs": configs,
	})
}

// UpdateSystemConfig 更新系统配置
// PUT /api/admin/configs/:key
func UpdateSystemConfig(c *gin.Context) {
	adminID := c.GetString("user_id")
	key := c.Param("key")

	var input struct {
		Value       string `json:"value" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var config models.SystemConfig
	err := tx.Where("key = ?", key).First(&config).Error

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "配置项不存在"})
		return
	}

	// 更新配置
	updates := map[string]interface{}{
		"value":       input.Value,
		"updated_by":  adminID,
	}
	if input.Description != "" {
		updates["description"] = input.Description
	}

	if err := tx.Model(&config).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	// 记录操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "config_update",
		TargetType: "config",
		TargetID:   key,
		Description:    "Value: " + input.Value,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "配置已更新",
		"config":  config,
	})
}

// CreateSystemConfig 创建系统配置（超级管理员）
// POST /api/admin/configs
func CreateSystemConfig(c *gin.Context) {
	adminID := c.GetString("user_id")

	var input models.SystemConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.UpdatedBy = adminID

	tx := database.DB.Begin()

	if err := tx.Create(&input).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	// 记录操作
	log := models.AdminLog{
		AdminID:    adminID,

		Action:     "config_create",
		TargetType: "config",
		TargetID:   input.Key,
		Description:    "Category: " + input.Category,
	}
	tx.Create(&log)

	tx.Commit()

	c.JSON(http.StatusCreated, input)
}

// ==================== 操作日志 ====================

// GetAdminLogs 获取管理员操作日志
// GET /api/admin/logs?admin_id=xxx&action=user_ban&start_date=2025-01-01&page=1&limit=50
func GetAdminLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	adminID := c.Query("admin_id")
	action := c.Query("action")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	offset := (page - 1) * limit

	query := database.DB.Model(&models.AdminLog{})

	if adminID != "" {
		query = query.Where("admin_id = ?", adminID)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var logs []models.AdminLog
	err := query.
		Preload("Admin").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&logs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取日志失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetAdminStats 获取管理后台统计数据
// GET /api/admin/stats
func GetAdminStats(c *gin.Context) {
	var stats struct {
		TotalUsers      int64 `json:"total_users"`
		BannedUsers     int64 `json:"banned_users"`
		PendingQuestions int64 `json:"pending_questions"`
		PendingReports  int64 `json:"pending_reports"`
		TodayLogins     int64 `json:"today_logins"`
		TodaySignups    int64 `json:"today_signups"`
	}

	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
	database.DB.Model(&models.User{}).Where("is_banned = ?", true).Count(&stats.BannedUsers)
	database.DB.Model(&models.Question{}).Where("verification_status = ?", "pending").Count(&stats.PendingQuestions)
	database.DB.Model(&models.UserReport{}).Where("status = ?", "pending").Count(&stats.PendingReports)

	// 今日登录和注册（简化实现）
	today := time.Now().Truncate(24 * time.Hour)
	database.DB.Model(&models.User{}).Where("created_at >= ?", today).Count(&stats.TodaySignups)

	c.JSON(http.StatusOK, stats)
}
