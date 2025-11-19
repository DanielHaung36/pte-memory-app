package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
)

type SocialController struct{}

func NewSocialController() *SocialController {
	return &SocialController{}
}

// CreatePost creates a new social post
func (sc *SocialController) CreatePost(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	var req struct {
		Content         string                    `json:"content" binding:"required"`
		PostType        string                    `json:"post_type"`
		Title           string                    `json:"title"`
		Images          []string                  `json:"images"`
		Tags            []string                  `json:"tags"`
		Privacy         string                    `json:"privacy"`
		StudyData       *models.StudySessionData  `json:"study_data"`
		AchievementData *models.AchievementData   `json:"achievement_data"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	post := models.Post{
		UserID:          userID,
		Content:         req.Content,
		PostType:        req.PostType,
		Title:           req.Title,
		Images:          req.Images,
		Tags:            req.Tags,
		Privacy:         req.Privacy,
		StudyData:       req.StudyData,
		AchievementData: req.AchievementData,
	}

	if post.PostType == "" {
		post.PostType = "study_session"
	}
	if post.Privacy == "" {
		post.Privacy = "public"
	}

	if err := models.CreatePost(database.DB, &post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	// Load relationships
	database.DB.Preload("User").First(&post, "id = ?", post.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

// GetFeed gets personalized feed posts
func (sc *SocialController) GetFeed(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	
	if limit > 100 {
		limit = 100
	}

	posts, err := models.GetFeedPosts(database.DB, userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch feed"})
		return
	}

	// Add user interaction status (liked, bookmarked)
	postsWithStatus := sc.addUserInteractionStatus(posts, userID)

	c.JSON(http.StatusOK, gin.H{
		"posts":  postsWithStatus,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

// GetPublicFeed gets public posts
func (sc *SocialController) GetPublicFeed(c *gin.Context) {
	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	filterType := c.DefaultQuery("type", "all") // all, achievement, study_session, tip, milestone
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	
	if limit > 100 {
		limit = 100
	}

	var posts []models.Post
	var err error

	query := database.DB.Where("privacy = ? AND deleted_at IS NULL", "public")
	
	if filterType != "all" {
		query = query.Where("post_type = ?", filterType)
	}

	err = query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Preload("Likes").
		Preload("Comments").
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	// Add user interaction status if user is authenticated
	userIDInterface, exists := c.Get("user_id")
	var postsWithStatus []gin.H
	if exists && userIDInterface != nil {
		userID := userIDInterface.(string)
		postsWithStatus = sc.addUserInteractionStatus(posts, userID)
	} else {
		for _, post := range posts {
			postsWithStatus = append(postsWithStatus, gin.H{
				"post":         post,
				"is_liked":     false,
				"is_bookmarked": false,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":  postsWithStatus,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
		"filter": filterType,
	})
}

// GetUserPosts gets posts by specific user
func (sc *SocialController) GetUserPosts(c *gin.Context) {
	targetUserID := c.Param("userId")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	currentUserIDInterface, exists := c.Get("user_id")
	var currentUserID string
	if exists && currentUserIDInterface != nil {
		currentUserID = currentUserIDInterface.(string)
	}
	
	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	posts, err := models.GetPostsByUser(database.DB, targetUserID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user posts"})
		return
	}

	// Filter posts based on privacy and relationship
	filteredPosts := sc.filterPostsByPrivacy(posts, currentUserID, targetUserID)
	
	// Add user interaction status
	var postsWithStatus []gin.H
	if currentUserID != "" {
		postsWithStatus = sc.addUserInteractionStatus(filteredPosts, currentUserID)
	} else {
		for _, post := range filteredPosts {
			postsWithStatus = append(postsWithStatus, gin.H{
				"post":         post,
				"is_liked":     false,
				"is_bookmarked": false,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":  postsWithStatus,
		"count":  len(filteredPosts),
		"limit":  limit,
		"offset": offset,
	})
}

// LikePost toggles like on a post
func (sc *SocialController) LikePost(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	postID := c.Param("postId")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	isLiked, err := models.LikePost(database.DB, userID, postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process like"})
		return
	}

	action := "unliked"
	if isLiked {
		action = "liked"
		// Create notification for post owner
		sc.createLikeNotification(postID, userID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Post " + action + " successfully",
		"is_liked":  isLiked,
	})
}

// CreateComment creates a comment on a post
func (sc *SocialController) CreateComment(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	postID := c.Param("postId")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	var req struct {
		Content       string   `json:"content"`
		ParentID      *string  `json:"parent_id"`
		ReplyToUserID *string  `json:"reply_to_user_id"`
		Images        []string `json:"images"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate that either content or images are provided
	if strings.TrimSpace(req.Content) == "" && len(req.Images) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content or images required"})
		return
	}

	comment := models.Comment{
		UserID:        userID,
		PostID:        postID,
		Content:       req.Content,
		ParentID:      req.ParentID,
		ReplyToUserID: req.ReplyToUserID,
		Images:        req.Images,
	}

	if err := models.CreateComment(database.DB, &comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// Load relationships
	database.DB.Preload("User").First(&comment, "id = ?", comment.ID)

	// Create notification for post owner
	sc.createCommentNotification(postID, userID, comment.Content)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment created successfully",
		"comment": comment,
	})
}

// GetComments gets comments for a post
func (sc *SocialController) GetComments(c *gin.Context) {
	postID := c.Param("postId")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	// Get current user ID if authenticated
	userIDInterface, _ := c.Get("user_id")
	var currentUserID string
	if userIDInterface != nil {
		currentUserID = userIDInterface.(string)
	}

	// Get all comments (flat structure)
	var comments []models.Comment
	err := database.DB.Where("post_id = ? AND deleted_at IS NULL", postID).
		Order("created_at ASC").
		Preload("User").
		Preload("ReplyToUser").
		Find(&comments).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	// Add user interaction status for each comment
	type CommentWithStatus struct {
		models.Comment
		IsLiked    bool `json:"is_liked"`
		IsDisliked bool `json:"is_disliked"`
	}

	commentsWithStatus := make([]CommentWithStatus, 0, len(comments))
	for _, comment := range comments {
		commentStatus := CommentWithStatus{
			Comment:    comment,
			IsLiked:    false,
			IsDisliked: false,
		}

		if currentUserID != "" {
			// Check if user liked this comment
			var like models.Like
			if err := database.DB.Where("user_id = ? AND entity_type = ? AND entity_id = ?",
				currentUserID, "comment", comment.ID).First(&like).Error; err == nil {
				commentStatus.IsLiked = true
			}

			// Check if user disliked this comment
			var dislike models.Dislike
			if err := database.DB.Where("user_id = ? AND entity_type = ? AND entity_id = ?",
				currentUserID, "comment", comment.ID).First(&dislike).Error; err == nil {
				commentStatus.IsDisliked = true
			}
		}

		commentsWithStatus = append(commentsWithStatus, commentStatus)
	}

	c.JSON(http.StatusOK, gin.H{
		"comments": commentsWithStatus,
		"count":    len(commentsWithStatus),
	})
}

// LikeComment toggles like on a comment
func (sc *SocialController) LikeComment(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	postID := c.Param("postId")
	commentID := c.Param("commentId")
	if postID == "" || commentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID and Comment ID are required"})
		return
	}

	isLiked, err := models.LikeComment(database.DB, userID, commentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process like"})
		return
	}

	action := "unliked"
	if isLiked {
		action = "liked"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Comment " + action + " successfully",
		"is_liked":  isLiked,
	})
}

// DislikeComment toggles dislike on a comment
func (sc *SocialController) DislikeComment(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	postID := c.Param("postId")
	commentID := c.Param("commentId")
	if postID == "" || commentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID and Comment ID are required"})
		return
	}

	isDisliked, err := models.DislikeComment(database.DB, userID, commentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process dislike"})
		return
	}

	action := "removed dislike from"
	if isDisliked {
		action = "disliked"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Comment " + action + " successfully",
		"is_disliked":  isDisliked,
	})
}

// FollowUser follows or unfollows a user
func (sc *SocialController) FollowUser(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	targetUserID := c.Param("userId")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	isFollowing, err := models.FollowUser(database.DB, userID, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process follow"})
		return
	}

	action := "unfollowed"
	if isFollowing {
		action = "followed"
		// Create notification for target user
		sc.createFollowNotification(targetUserID, userID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "User " + action + " successfully",
		"is_following": isFollowing,
	})
}

// GetFollowStats gets follower/following counts for a user
func (sc *SocialController) GetFollowStats(c *gin.Context) {
	targetUserID := c.Param("userId")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	followers, following, err := models.GetUserFollowStats(database.DB, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch follow stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"followers_count": followers,
		"following_count": following,
	})
}

// BookmarkPost toggles bookmark on a post
func (sc *SocialController) BookmarkPost(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	postID := c.Param("postId")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	var bookmark models.Bookmark
	err := database.DB.Where("user_id = ? AND post_id = ?", userID, postID).First(&bookmark).Error
	
	var isBookmarked bool
	if err != nil {
		// Create new bookmark
		bookmark = models.Bookmark{
			ID:     models.GenerateID(),
			UserID: userID,
			PostID: postID,
		}
		if err := database.DB.Create(&bookmark).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bookmark post"})
			return
		}
		isBookmarked = true
	} else {
		// Remove bookmark
		if err := database.DB.Delete(&bookmark).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unbookmark post"})
			return
		}
		isBookmarked = false
	}

	action := "unbookmarked"
	if isBookmarked {
		action = "bookmarked"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Post " + action + " successfully",
		"is_bookmarked": isBookmarked,
	})
}

// GetBookmarks gets user's bookmarked posts
func (sc *SocialController) GetBookmarks(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(string)

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	var bookmarks []models.Bookmark
	err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("Post.User").
		Find(&bookmarks).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookmarks"})
		return
	}

	var posts []models.Post
	for _, bookmark := range bookmarks {
		posts = append(posts, bookmark.Post)
	}

	postsWithStatus := sc.addUserInteractionStatus(posts, userID)

	c.JSON(http.StatusOK, gin.H{
		"bookmarks": postsWithStatus,
		"count":     len(bookmarks),
		"limit":     limit,
		"offset":    offset,
	})
}

// Helper functions

func (sc *SocialController) addUserInteractionStatus(posts []models.Post, userID string) []gin.H {
	var result []gin.H
	
	// Get user's likes
	var likes []models.Like
	database.DB.Where("user_id = ? AND entity_type = ?", userID, "post").Find(&likes)
	likeMap := make(map[string]bool)
	for _, like := range likes {
		likeMap[like.EntityID] = true
	}
	
	// Get user's bookmarks
	var bookmarks []models.Bookmark
	database.DB.Where("user_id = ?", userID).Find(&bookmarks)
	bookmarkMap := make(map[string]bool)
	for _, bookmark := range bookmarks {
		bookmarkMap[bookmark.PostID] = true
	}

	for _, post := range posts {
		result = append(result, gin.H{
			"post":         post,
			"is_liked":     likeMap[post.ID],
			"is_bookmarked": bookmarkMap[post.ID],
		})
	}
	
	return result
}

func (sc *SocialController) filterPostsByPrivacy(posts []models.Post, currentUserID, targetUserID string) []models.Post {
	if currentUserID == targetUserID {
		return posts // User can see their own posts
	}
	
	var filteredPosts []models.Post
	for _, post := range posts {
		if post.Privacy == "public" {
			filteredPosts = append(filteredPosts, post)
		} else if post.Privacy == "friends" && currentUserID != "" {
			// Check if users are friends (following each other)
			var follow models.Follow
			err := database.DB.Where("follower_id = ? AND following_id = ?", currentUserID, targetUserID).First(&follow).Error
			if err == nil {
				filteredPosts = append(filteredPosts, post)
			}
		}
	}
	
	return filteredPosts
}

func (sc *SocialController) createLikeNotification(postID, actorID string) {
	var post models.Post
	if err := database.DB.First(&post, "id = ?", postID).Error; err != nil {
		return
	}
	
	if post.UserID == actorID {
		return // Don't notify user about their own likes
	}
	
	notification := models.Notification{
		UserID:      post.UserID,
		Type:        "post_liked",
		Category:    "social",
		Title:       "新的点赞",
		Message:     "有人点赞了你的帖子",
		ActionURL:   "/social/posts/" + postID,
		RelatedID:   postID,
		RelatedType: "post",
	}

	database.DB.Create(&notification)
}

func (sc *SocialController) createCommentNotification(postID, actorID, content string) {
	var post models.Post
	if err := database.DB.First(&post, "id = ?", postID).Error; err != nil {
		return
	}
	
	if post.UserID == actorID {
		return // Don't notify user about their own comments
	}
	
	preview := content
	if len(content) > 50 {
		preview = content[:50] + "..."
	}

	notification := models.Notification{
		UserID:      post.UserID,
		Type:        "post_commented",
		Category:    "social",
		Title:       "新的评论",
		Message:     "有人评论了你的帖子: " + preview,
		ActionURL:   "/social/posts/" + postID,
		RelatedID:   postID,
		RelatedType: "post",
	}

	database.DB.Create(&notification)
}

func (sc *SocialController) createFollowNotification(userID, actorID string) {
	notification := models.Notification{
		UserID:      userID,
		Type:        "user_followed",
		Category:    "social",
		Title:       "新的粉丝",
		Message:     "有人关注了你",
		ActionURL:   "/social/users/" + actorID,
		RelatedID:   actorID,
		RelatedType: "user",
	}

	database.DB.Create(&notification)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}