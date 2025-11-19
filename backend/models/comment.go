package models

import (
	"time"
	"gorm.io/gorm"
)

// CommentType 评论类型
type CommentType string

const (
	CommentTypeText  CommentType = "text"  // 文字评论
	CommentTypeAudio CommentType = "audio" // 音频评论
	CommentTypeNote  CommentType = "note"  // 笔记
	CommentTypeMixed CommentType = "mixed" // 混合型（文字+音频）
)

// QuestionComment 题目评论模型
type QuestionComment struct {
	ID          string      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      string      `json:"user_id" gorm:"type:uuid;not null;index"`
	QuestionID  string      `json:"question_id" gorm:"type:uuid;not null;index"`
	ParentID    *string     `json:"parent_id" gorm:"type:uuid;index"` // 父评论ID，用于回复
	CommentType CommentType `json:"comment_type" gorm:"type:varchar(20);default:'text'"`
	Content     string      `json:"content" gorm:"type:text"` // 文字内容
	AudioURL    string      `json:"audio_url"` // 音频文件URL
	Duration    int         `json:"duration"` // 音频时长（秒）

	// 笔记相关字段
	NoteTitle   string      `json:"note_title"` // 笔记标题
	NoteTags    StringArray `json:"note_tags" gorm:"type:text[]"` // 笔记标签
	IsPrivate   bool        `json:"is_private" gorm:"default:false"` // 是否私密

	// 社交功能
	LikeCount   int         `json:"like_count" gorm:"default:0"` // 点赞数
	ReplyCount  int         `json:"reply_count" gorm:"default:0"` // 回复数
	IsPinned    bool        `json:"is_pinned" gorm:"default:false"` // 是否置顶

	// 元数据
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt  `json:"-" gorm:"index"`

	// 关联
	User        User             `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Question    Question         `json:"question,omitempty" gorm:"foreignKey:QuestionID"`
	Parent      *QuestionComment `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies     []QuestionComment `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	Likes       []CommentLike    `json:"likes,omitempty" gorm:"foreignKey:CommentID"`
}

// CommentLike 评论点赞记录
type CommentLike struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string    `json:"user_id" gorm:"type:uuid;not null;index"`
	CommentID string    `json:"comment_id" gorm:"type:uuid;not null;index"`
	CreatedAt time.Time `json:"created_at"`

	// 关联
	User      User            `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Comment   QuestionComment `json:"comment,omitempty" gorm:"foreignKey:CommentID"`
}

// GetCommentsByQuestion 获取题目的所有评论
func GetCommentsByQuestion(db *gorm.DB, questionID string, limit int, offset int) ([]QuestionComment, error) {
	var comments []QuestionComment
	err := db.Preload("User").
		Preload("Replies").
		Preload("Replies.User").
		Where("question_id = ? AND parent_id IS NULL", questionID).
		Order("is_pinned DESC, created_at DESC").
		Limit(limit).Offset(offset).
		Find(&comments).Error
	return comments, err
}

// GetCommentsByUser 获取用户的所有评论
func GetCommentsByUser(db *gorm.DB, userID string, limit int, offset int) ([]QuestionComment, error) {
	var comments []QuestionComment
	err := db.Preload("Question").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&comments).Error
	return comments, err
}

// GetCommentReplies 获取评论的回复
func GetCommentReplies(db *gorm.DB, parentID string) ([]QuestionComment, error) {
	var replies []QuestionComment
	err := db.Preload("User").
		Where("parent_id = ?", parentID).
		Order("created_at ASC").
		Find(&replies).Error
	return replies, err
}

// IsLikedByUser 检查用户是否已点赞
func (c *QuestionComment) IsLikedByUser(db *gorm.DB, userID string) bool {
	var count int64
	db.Model(&CommentLike{}).
		Where("comment_id = ? AND user_id = ?", c.ID, userID).
		Count(&count)
	return count > 0
}

// AddLike 添加点赞
func (c *QuestionComment) AddLike(db *gorm.DB, userID string) error {
	// 检查是否已经点赞
	if c.IsLikedByUser(db, userID) {
		return nil
	}

	// 开始事务
	tx := db.Begin()

	// 创建点赞记录
	like := CommentLike{
		UserID:    userID,
		CommentID: c.ID,
	}
	if err := tx.Create(&like).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 更新点赞数
	if err := tx.Model(c).Update("like_count", gorm.Expr("like_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}

// RemoveLike 移除点赞
func (c *QuestionComment) RemoveLike(db *gorm.DB, userID string) error {
	// 开始事务
	tx := db.Begin()

	// 删除点赞记录
	if err := tx.Where("comment_id = ? AND user_id = ?", c.ID, userID).Delete(&CommentLike{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 更新点赞数
	if err := tx.Model(c).Update("like_count", gorm.Expr("like_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}
