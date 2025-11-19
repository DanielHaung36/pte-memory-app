package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetPublicLibraries 获取公开题库列表
// GET /api/library/public?category=PTE&limit=20&offset=0
func GetPublicLibraries(c *gin.Context) {
	category := c.Query("category")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	var libraries []models.QuestionLibrary
	query := database.DB.Where("is_published = ? AND verification_status = ?", true, "approved")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	var total int64
	query.Model(&models.QuestionLibrary{}).Count(&total)

	if err := query.Preload("Creator").
		Limit(limit).
		Offset(offset).
		Order("downloads DESC, rating DESC").
		Find(&libraries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题库失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"libraries": libraries,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetLibraryDetail 获取题库详情
// GET /api/library/:id
func GetLibraryDetail(c *gin.Context) {
	libraryID := c.Param("id")

	var library models.QuestionLibrary
	if err := database.DB.Preload("Creator").
		Preload("Questions").
		First(&library, "id = ?", libraryID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题库不存在"})
		return
	}

	// 增加浏览量
	library.Views++
	database.DB.Save(&library)

	c.JSON(http.StatusOK, library)
}

// CreateLibrary 创建题库
// POST /api/library
func CreateLibrary(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Category    string   `json:"category" binding:"required"`
		SubCategory string   `json:"sub_category"`
		Tags        []string `json:"tags"`
		IsFree      bool     `json:"is_free"`
		QuestionIDs []string `json:"question_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	library := models.QuestionLibrary{
		Name:          input.Name,
		Description:   input.Description,
		Category:      input.Category,
		SubCategory:   input.SubCategory,
		Tags:          input.Tags,
		IsFree:        input.IsFree,
		CreatorID:     userID,
		QuestionCount: len(input.QuestionIDs),
	}

	if err := database.DB.Create(&library).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建题库失败"})
		return
	}

	// 关联题目
	if len(input.QuestionIDs) > 0 {
		for i, qID := range input.QuestionIDs {
			libQuestion := models.LibraryQuestion{
				LibraryID:  library.ID,
				QuestionID: qID,
				OrderIndex: i,
			}
			database.DB.Create(&libQuestion)
		}
	}

	c.JSON(http.StatusCreated, library)
}

// DownloadLibrary 下载题库到个人题库
// POST /api/library/:id/download
func DownloadLibrary(c *gin.Context) {
	userID := c.GetString("user_id")
	libraryID := c.Param("id")

	// 检查题库是否存在
	var library models.QuestionLibrary
	if err := database.DB.First(&library, "id = ?", libraryID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题库不存在"})
		return
	}

	// 检查是否已下载
	var existing models.UserLibrary
	if err := database.DB.Where("user_id = ? AND library_id = ?", userID, libraryID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "已下载过该题库",
			"library": existing,
		})
		return
	}

	// 创建下载记录
	userLibrary := models.UserLibrary{
		UserID:    userID,
		LibraryID: libraryID,
	}

	if err := database.DB.Create(&userLibrary).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "下载失败"})
		return
	}

	// 更新下载计数
	library.Downloads++
	database.DB.Save(&library)

	// 获取题库中的题目并复制到用户题库
	var libQuestions []models.LibraryQuestion
	database.DB.Where("library_id = ?", libraryID).Preload("Question").Find(&libQuestions)

	copiedCount := 0
	for _, lq := range libQuestions {
		// 复制题目
		newQuestion := lq.Question
		newQuestion.ID = "" // 清空ID，让数据库生成新ID
		newQuestion.UserID = userID
		if err := database.DB.Create(&newQuestion).Error; err == nil {
			copiedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "下载成功",
		"library":       userLibrary,
		"copied_questions": copiedCount,
	})
}

// GetMyLibraries 获取我下载的题库
// GET /api/library/my
func GetMyLibraries(c *gin.Context) {
	userID := c.GetString("user_id")

	var userLibraries []models.UserLibrary
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Library").
		Preload("Library.Creator").
		Order("last_study_date DESC NULLS LAST").
		Find(&userLibraries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题库失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"libraries": userLibraries,
		"total":     len(userLibraries),
	})
}

// RateLibrary 评分题库
// POST /api/library/:id/rate
func RateLibrary(c *gin.Context) {
	userID := c.GetString("user_id")
	libraryID := c.Param("id")

	var input struct {
		Rating int    `json:"rating" binding:"required,min=1,max=5"`
		Review string `json:"review"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查是否已评分
	var existing models.LibraryRating
	if err := database.DB.Where("user_id = ? AND library_id = ?", userID, libraryID).First(&existing).Error; err == nil {
		// 更新评分
		existing.Rating = input.Rating
		existing.Review = input.Review
		database.DB.Save(&existing)
	} else {
		// 创建新评分
		rating := models.LibraryRating{
			UserID:    userID,
			LibraryID: libraryID,
			Rating:    input.Rating,
			Review:    input.Review,
		}
		database.DB.Create(&rating)
	}

	// 重新计算题库平均评分
	var avgRating float64
	var ratingCount int64
	database.DB.Model(&models.LibraryRating{}).
		Where("library_id = ?", libraryID).
		Count(&ratingCount)
	database.DB.Model(&models.LibraryRating{}).
		Where("library_id = ?", libraryID).
		Select("AVG(rating)").
		Row().Scan(&avgRating)

	// 更新题库评分
	database.DB.Model(&models.QuestionLibrary{}).
		Where("id = ?", libraryID).
		Updates(map[string]interface{}{
			"rating":       avgRating,
			"rating_count": ratingCount,
		})

	c.JSON(http.StatusOK, gin.H{
		"message":      "评分成功",
		"rating":       input.Rating,
		"avg_rating":   avgRating,
		"rating_count": ratingCount,
	})
}

// ContributeQuestion 贡献题目到公共题库
// POST /api/questions/contribute
func ContributeQuestion(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		QuestionID string `json:"question_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取题目
	var question models.Question
	if err := database.DB.First(&question, "id = ? AND user_id = ?", input.QuestionID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	// 标记为公开和免费
	question.IsPublic = true
	question.IsFreeQuestion = true
	question.ContributorID = userID
	question.VerificationStatus = "pending"

	if err := database.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "贡献失败"})
		return
	}

	// 奖励贡献者积分
	var user models.User
	database.DB.First(&user, "id = ?", userID)
	user.AddXP(50) // 贡献题目奖励50XP
	database.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message":  "贡献成功，等待审核",
		"question": question,
		"reward":   50,
	})
}

// GetReferralCode 获取用户推荐码
// GET /api/referral/code
func GetReferralCode(c *gin.Context) {
	userID := c.GetString("user_id")

	var referralCode models.ReferralCode
	err := database.DB.Where("user_id = ?", userID).First(&referralCode).Error

	if err == gorm.ErrRecordNotFound {
		// 创建推荐码
		code := generateReferralCode()
		referralCode = models.ReferralCode{
			UserID: userID,
			Code:   code,
		}
		database.DB.Create(&referralCode)
	}

	// 获取使用记录
	var usages []models.ReferralUsage
	database.DB.Where("referral_code_id = ?", referralCode.ID).
		Preload("ReferredUser").
		Order("created_at DESC").
		Find(&usages)

	c.JSON(http.StatusOK, gin.H{
		"referral_code": referralCode,
		"usages":        usages,
	})
}

// RedeemReferralCode 使用推荐码
// POST /api/referral/redeem
func RedeemReferralCode(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Code string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找推荐码
	var referralCode models.ReferralCode
	if err := database.DB.Where("code = ? AND is_active = ?", input.Code, true).First(&referralCode).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "推荐码无效"})
		return
	}

	// 不能使用自己的推荐码
	if referralCode.UserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能使用自己的推荐码"})
		return
	}

	// 检查是否已使用过推荐码
	var existingUsage models.ReferralUsage
	if err := database.DB.Where("referred_user_id = ?", userID).First(&existingUsage).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "已使用过推荐码"})
		return
	}

	// 创建使用记录
	usage := models.ReferralUsage{
		ReferralCodeID: referralCode.ID,
		ReferrerID:     referralCode.UserID,
		ReferredUserID: userID,
		ReferrerReward: 100, // 推荐人奖励100XP
		ReferredReward: 50,  // 新用户奖励50XP
		Status:         "completed",
	}
	now := time.Now()
	usage.CompletedAt = &now

	if err := database.DB.Create(&usage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "兑换失败"})
		return
	}

	// 更新推荐码统计
	referralCode.UsageCount++
	referralCode.TotalRewards += usage.ReferrerReward
	database.DB.Save(&referralCode)

	// 奖励双方用户
	var referrer, referred models.User
	database.DB.First(&referrer, "id = ?", referralCode.UserID)
	database.DB.First(&referred, "id = ?", userID)

	referrer.AddXP(usage.ReferrerReward)
	referred.AddXP(usage.ReferredReward)

	database.DB.Save(&referrer)
	database.DB.Save(&referred)

	c.JSON(http.StatusOK, gin.H{
		"message":         "兑换成功",
		"reward":          usage.ReferredReward,
		"referrer_reward": usage.ReferrerReward,
	})
}

// 生成唯一推荐码
func generateReferralCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return "REF" + hex.EncodeToString(bytes)
}
