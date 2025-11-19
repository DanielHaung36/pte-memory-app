package controllers

import (
	"net/http"
	"strconv"

	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"

	"github.com/gin-gonic/gin"
)

type CommentController struct{}

func NewCommentController() *CommentController {
	return &CommentController{}
}

// CreateCommentRequest 创建评论请求
type CreateCommentRequest struct {
	QuestionID  string              `json:"question_id" binding:"required"`
	ParentID    *string             `json:"parent_id"`
	CommentType models.CommentType  `json:"comment_type" binding:"required"`
	Content     string              `json:"content"`
	AudioURL    string              `json:"audio_url"`
	Duration    int                 `json:"duration"`
	NoteTitle   string              `json:"note_title"`
	NoteTags    []string            `json:"note_tags"`
	IsPrivate   bool                `json:"is_private"`
}

// CreateComment 创建评论
func (cc *CommentController) CreateComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误", "details": err.Error()})
		return
	}

	// 验证题目是否存在
	var question models.Question
	if err := database.DB.First(&question, "id = ?", req.QuestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	// 如果是回复，验证父评论是否存在
	if req.ParentID != nil {
		var parentComment models.QuestionComment
		if err := database.DB.First(&parentComment, "id = ?", *req.ParentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "父评论不存在"})
			return
		}
	}

	// 创建评论
	comment := models.QuestionComment{
		UserID:      userID,
		QuestionID:  req.QuestionID,
		ParentID:    req.ParentID,
		CommentType: req.CommentType,
		Content:     req.Content,
		AudioURL:    req.AudioURL,
		Duration:    req.Duration,
		NoteTitle:   req.NoteTitle,
		NoteTags:    models.StringArray(req.NoteTags),
		IsPrivate:   req.IsPrivate,
	}

	tx := database.DB.Begin()

	if err := tx.Create(&comment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建评论失败"})
		return
	}

	// 如果是回复，更新父评论的回复数
	if req.ParentID != nil {
		tx.Model(&models.QuestionComment{}).
			Where("id = ?", *req.ParentID).
			Update("reply_count", database.DB.Raw("reply_count + 1"))
	}

	tx.Commit()

	// 加载评论关联数据
	database.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "评论创建成功",
		"comment": comment,
	})
}

// GetCommentsByQuestion 获取题目的评论列表
func (cc *CommentController) GetCommentsByQuestion(c *gin.Context) {
	questionID := c.Param("question_id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	comments, err := models.GetCommentsByQuestion(database.DB, questionID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取评论失败"})
		return
	}

	// 获取总数
	var total int64
	database.DB.Model(&models.QuestionComment{}).
		Where("question_id = ? AND parent_id IS NULL", questionID).
		Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"comments": comments,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetComment 获取单个评论详情
func (cc *CommentController) GetComment(c *gin.Context) {
	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.Preload("User").
		Preload("Replies").
		Preload("Replies.User").
		First(&comment, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"comment": comment,
	})
}

// UpdateComment 更新评论
func (cc *CommentController) UpdateComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.First(&comment, "id = ? AND user_id = ?", commentID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在或无权限"})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 更新评论
	comment.Content = req.Content
	comment.AudioURL = req.AudioURL
	comment.Duration = req.Duration
	comment.NoteTitle = req.NoteTitle
	comment.NoteTags = models.StringArray(req.NoteTags)
	comment.IsPrivate = req.IsPrivate

	if err := database.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新评论失败"})
		return
	}

	database.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "评论更新成功",
		"comment": comment,
	})
}

// DeleteComment 删除评论
func (cc *CommentController) DeleteComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.First(&comment, "id = ? AND user_id = ?", commentID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在或无权限"})
		return
	}

	tx := database.DB.Begin()

	// 如果是回复，更新父评论的回复数
	if comment.ParentID != nil {
		tx.Model(&models.QuestionComment{}).
			Where("id = ?", *comment.ParentID).
			Update("reply_count", database.DB.Raw("reply_count - 1"))
	}

	// 删除评论及其所有回复
	if err := tx.Delete(&comment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除评论失败"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "评论删除成功",
	})
}

// LikeComment 点赞评论
func (cc *CommentController) LikeComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.First(&comment, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	if err := comment.AddLike(database.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "点赞失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "点赞成功",
		"like_count": comment.LikeCount + 1,
	})
}

// UnlikeComment 取消点赞评论
func (cc *CommentController) UnlikeComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.First(&comment, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	if err := comment.RemoveLike(database.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "取消点赞失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "取消点赞成功",
		"like_count": comment.LikeCount - 1,
	})
}

// GetMyComments 获取我的评论列表
func (cc *CommentController) GetMyComments(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	comments, err := models.GetCommentsByUser(database.DB, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取评论失败"})
		return
	}

	var total int64
	database.DB.Model(&models.QuestionComment{}).
		Where("user_id = ?", userID).
		Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"comments": comments,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// PinComment 置顶评论
func (cc *CommentController) PinComment(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	commentID := c.Param("id")

	var comment models.QuestionComment
	if err := database.DB.Preload("Question").First(&comment, "id = ?", commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "评论不存在"})
		return
	}

	// 只有题目创建者可以置顶评论
	if comment.Question.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限"})
		return
	}

	comment.IsPinned = !comment.IsPinned
	if err := database.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "操作成功",
		"is_pinned": comment.IsPinned,
	})
}
