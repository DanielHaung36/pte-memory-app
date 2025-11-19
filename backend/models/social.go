package models

import (
	"time"
	"gorm.io/gorm"
	"github.com/google/uuid"
)

// Post represents a social media post in the learning community
type Post struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"user_id" gorm:"not null"`
	Content     string    `json:"content" gorm:"type:text;not null"`
	PostType    string    `json:"post_type" gorm:"default:'study_session'"` // study_session, achievement, milestone, tip, question, celebration
	Title       string    `json:"title"`
	Images      []string  `json:"images" gorm:"serializer:json"`
	Tags        []string  `json:"tags" gorm:"serializer:json"`
	Privacy     string    `json:"privacy" gorm:"default:'public'"` // public, friends, private
	IsArchived  bool      `json:"is_archived" gorm:"default:false"`
	
	// Study session specific data
	StudyData   *StudySessionData `json:"study_data" gorm:"serializer:json"`
	
	// Achievement specific data
	AchievementData *AchievementData `json:"achievement_data" gorm:"serializer:json"`
	
	// Engagement metrics
	LikesCount    int `json:"likes_count" gorm:"default:0"`
	CommentsCount int `json:"comments_count" gorm:"default:0"`
	SharesCount   int `json:"shares_count" gorm:"default:0"`
	ViewsCount    int `json:"views_count" gorm:"default:0"`
	
	// Relationships
	User     User      `json:"user" gorm:"foreignKey:UserID"`
	Likes    []Like    `json:"likes,omitempty" gorm:"polymorphic:Entity;polymorphicValue:post"`
	Comments []Comment `json:"comments,omitempty" gorm:"foreignKey:PostID"`
	Shares   []Share   `json:"shares,omitempty"`
	
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// StudySessionData contains study-specific information for posts
type StudySessionData struct {
	QuestionsCompleted int     `json:"questions_completed"`
	Accuracy          float64 `json:"accuracy"`
	TimeSpent         int     `json:"time_spent"` // in minutes
	Subject           string  `json:"subject"`
	DifficultyLevel   int     `json:"difficulty_level"`
	StreakCount       int     `json:"streak_count"`
	XPGained          int     `json:"xp_gained"`
	Improvements      []string `json:"improvements"`
}

// AchievementData contains achievement-specific information
type AchievementData struct {
	AchievementID   string `json:"achievement_id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Badge          string `json:"badge"`
	Category       string `json:"category"`
	Rarity         string `json:"rarity"` // common, rare, epic, legendary
	XPReward       int    `json:"xp_reward"`
}

// Like represents a like on a post or comment
type Like struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	UserID     string    `json:"user_id" gorm:"not null"`
	EntityType string    `json:"entity_type" gorm:"not null"` // "post", "comment", "study_group_post", "study_group_comment"
	EntityID   string    `json:"entity_id" gorm:"not null"`

	User User `json:"user" gorm:"foreignKey:UserID"`

	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Dislike represents a dislike on a comment
type Dislike struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	UserID     string    `json:"user_id" gorm:"not null"`
	EntityType string    `json:"entity_type" gorm:"not null"` // "comment"
	EntityID   string    `json:"entity_id" gorm:"not null"`

	User User `json:"user" gorm:"foreignKey:UserID"`

	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"not null"`
	PostID    string    `json:"post_id" gorm:"not null"`
	ParentID  *string   `json:"parent_id,omitempty"` // for nested comments
	ReplyToUserID *string `json:"reply_to_user_id,omitempty"` // who is being replied to
	Content   string    `json:"content" gorm:"type:text;not null"`
	Images    []string  `json:"images" gorm:"serializer:json"`

	// Engagement
	LikesCount    int `json:"likes_count" gorm:"default:0"`
	DislikesCount int `json:"dislikes_count" gorm:"default:0"`

	// Relationships
	User        User      `json:"user" gorm:"foreignKey:UserID"`
	Post        Post      `json:"post" gorm:"foreignKey:PostID"`
	Parent      *Comment  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	ReplyToUser *User     `json:"reply_to_user,omitempty" gorm:"foreignKey:ReplyToUserID"`
	Replies     []Comment `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	Likes       []Like    `json:"likes,omitempty" gorm:"polymorphic:Entity;polymorphicValue:comment"`
	Dislikes    []Dislike `json:"dislikes,omitempty" gorm:"polymorphic:Entity;polymorphicValue:comment"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Share represents sharing a post
type Share struct {
	ID       string    `json:"id" gorm:"primaryKey"`
	UserID   string    `json:"user_id" gorm:"not null"`
	PostID   string    `json:"post_id" gorm:"not null"`
	Platform string    `json:"platform"` // internal, wechat, weibo, etc.
	Message  string    `json:"message"`  // optional message when sharing
	
	User User `json:"user" gorm:"foreignKey:UserID"`
	Post Post `json:"post" gorm:"foreignKey:PostID"`
	
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Follow represents following relationship between users
type Follow struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	FollowerID   string    `json:"follower_id" gorm:"not null"`  // who is following
	FollowingID  string    `json:"following_id" gorm:"not null"` // who is being followed
	IsAccepted   bool      `json:"is_accepted" gorm:"default:true"` // for private accounts
	
	Follower  User `json:"follower" gorm:"foreignKey:FollowerID"`
	Following User `json:"following" gorm:"foreignKey:FollowingID"`
	
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Bookmark represents saved/bookmarked posts
type Bookmark struct {
	ID       string    `json:"id" gorm:"primaryKey"`
	UserID   string    `json:"user_id" gorm:"not null"`
	PostID   string    `json:"post_id" gorm:"not null"`
	Category string    `json:"category"` // optional categorization
	Notes    string    `json:"notes"`    // personal notes about the bookmark
	
	User User `json:"user" gorm:"foreignKey:UserID"`
	Post Post `json:"post" gorm:"foreignKey:PostID"`
	
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// Notification represents social notifications
// Note: Notification model is now defined in reminder.go to avoid duplication
// Social notifications will use the same Notification model with Category = "social"

// StudyGroup represents learning groups
type StudyGroup struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	CreatorID   string    `json:"creator_id" gorm:"not null"`
	Category    string    `json:"category"` // PTE, IELTS, TOEFL, etc.
	Privacy     string    `json:"privacy" gorm:"default:'public'"` // public, private, invite_only
	MaxMembers  int       `json:"max_members" gorm:"default:100"`
	Avatar      string    `json:"avatar"`
	Cover       string    `json:"cover"`
	Rules       []string  `json:"rules" gorm:"serializer:json"`
	Tags        []string  `json:"tags" gorm:"serializer:json"`
	IsArchived  bool      `json:"is_archived" gorm:"default:false"`
	
	// Stats
	MembersCount int `json:"members_count" gorm:"default:0"`
	PostsCount   int `json:"posts_count" gorm:"default:0"`
	
	Creator User                `json:"creator" gorm:"foreignKey:CreatorID"`
	Members []StudyGroupMember  `json:"members,omitempty" gorm:"foreignKey:GroupID"`
	Posts   []StudyGroupPost    `json:"posts,omitempty" gorm:"foreignKey:GroupID"`
	
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// StudyGroupMember represents group membership
type StudyGroupMember struct {
	ID      string    `json:"id" gorm:"primaryKey"`
	GroupID string    `json:"group_id" gorm:"not null"`
	UserID  string    `json:"user_id" gorm:"not null"`
	Role    string    `json:"role" gorm:"default:'member'"` // admin, moderator, member
	Status  string    `json:"status" gorm:"default:'active'"` // active, banned, pending

	User  User        `json:"user" gorm:"foreignKey:UserID"`
	Group StudyGroup  `json:"group" gorm:"foreignKey:GroupID"`

	JoinedAt  time.Time      `json:"joined_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// StudyGroupPost represents posts within a study group
type StudyGroupPost struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	GroupID   string    `json:"group_id" gorm:"not null"`
	UserID    string    `json:"user_id" gorm:"not null"`
	Title     string    `json:"title"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	PostType  string    `json:"post_type" gorm:"default:'discussion'"` // discussion, resource, question, announcement
	Images    []string  `json:"images" gorm:"serializer:json"`
	Files     []string  `json:"files" gorm:"serializer:json"`
	Tags      []string  `json:"tags" gorm:"serializer:json"`
	IsPinned  bool      `json:"is_pinned" gorm:"default:false"`
	
	// Engagement
	LikesCount    int `json:"likes_count" gorm:"default:0"`
	CommentsCount int `json:"comments_count" gorm:"default:0"`
	ViewsCount    int `json:"views_count" gorm:"default:0"`
	
	User     User                   `json:"user" gorm:"foreignKey:UserID"`
	Likes    []Like                 `json:"likes,omitempty" gorm:"polymorphic:Entity;polymorphicValue:study_group_post"`
	Comments []StudyGroupComment    `json:"comments,omitempty" gorm:"foreignKey:PostID"`
	
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// StudyGroupComment represents comments on group posts
type StudyGroupComment struct {
	ID       string    `json:"id" gorm:"primaryKey"`
	PostID   string    `json:"post_id" gorm:"not null"`
	UserID   string    `json:"user_id" gorm:"not null"`
	ParentID *string   `json:"parent_id,omitempty"`
	Content  string    `json:"content" gorm:"type:text;not null"`
	Images   []string  `json:"images" gorm:"serializer:json"`
	
	LikesCount int `json:"likes_count" gorm:"default:0"`
	
	User    User                  `json:"user" gorm:"foreignKey:UserID"`
	Parent  *StudyGroupComment    `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies []StudyGroupComment   `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
	Likes   []Like                `json:"likes,omitempty" gorm:"polymorphic:Entity;polymorphicValue:study_group_comment"`
	
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// generateID generates a new UUID
func generateID() string {
	return uuid.New().String()
}

// GenerateID exports the function for external use
func GenerateID() string {
	return generateID()
}

// Social model functions

// CreatePost creates a new social post
func CreatePost(db *gorm.DB, post *Post) error {
	post.ID = generateID()
	return db.Create(post).Error
}

// GetPostsByUser retrieves posts by user ID with pagination
func GetPostsByUser(db *gorm.DB, userID string, limit, offset int) ([]Post, error) {
	var posts []Post
	err := db.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Preload("Likes").
		Preload("Comments").
		Find(&posts).Error
	return posts, err
}

// GetFeedPosts retrieves feed posts for a user (following + own posts)
func GetFeedPosts(db *gorm.DB, userID string, limit, offset int) ([]Post, error) {
	var posts []Post
	
	// Get following user IDs
	var followingIDs []string
	db.Model(&Follow{}).
		Where("follower_id = ? AND deleted_at IS NULL", userID).
		Pluck("following_id", &followingIDs)
	
	// Add user's own ID
	followingIDs = append(followingIDs, userID)
	
	err := db.Where("user_id IN ? AND privacy IN (?, ?) AND deleted_at IS NULL", 
		followingIDs, "public", "friends").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Preload("Likes").
		Preload("Comments").
		Find(&posts).Error
	
	return posts, err
}

// GetPublicPosts retrieves public posts with pagination
func GetPublicPosts(db *gorm.DB, limit, offset int) ([]Post, error) {
	var posts []Post
	err := db.Where("privacy = ? AND deleted_at IS NULL", "public").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User").
		Preload("Likes").
		Preload("Comments").
		Find(&posts).Error
	return posts, err
}

// LikePost toggles like on a post
func LikePost(db *gorm.DB, userID, postID string) (bool, error) {
	var like Like
	err := db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, "post", postID).First(&like).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new like
		like = Like{
			ID:         generateID(),
			UserID:     userID,
			EntityType: "post",
			EntityID:   postID,
		}
		if err := db.Create(&like).Error; err != nil {
			return false, err
		}
		
		// Update post likes count
		db.Model(&Post{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1))
		return true, nil
	} else if err == nil {
		// Remove like
		if err := db.Delete(&like).Error; err != nil {
			return false, err
		}
		
		// Update post likes count
		db.Model(&Post{}).Where("id = ?", postID).UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1))
		return false, nil
	}
	
	return false, err
}

// CreateComment creates a new comment
func CreateComment(db *gorm.DB, comment *Comment) error {
	comment.ID = generateID()
	if err := db.Create(comment).Error; err != nil {
		return err
	}
	
	// Update post comments count
	db.Model(&Post{}).Where("id = ?", comment.PostID).UpdateColumn("comments_count", gorm.Expr("comments_count + ?", 1))
	return nil
}

// FollowUser creates or removes a follow relationship
func FollowUser(db *gorm.DB, followerID, followingID string) (bool, error) {
	if followerID == followingID {
		return false, gorm.ErrInvalidData
	}
	
	var follow Follow
	err := db.Where("follower_id = ? AND following_id = ?", followerID, followingID).First(&follow).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new follow
		follow = Follow{
			ID:          generateID(),
			FollowerID:  followerID,
			FollowingID: followingID,
		}
		return true, db.Create(&follow).Error
	} else if err == nil {
		// Remove follow
		return false, db.Delete(&follow).Error
	}
	
	return false, err
}

// GetUserFollowStats gets follower/following counts
func GetUserFollowStats(db *gorm.DB, userID string) (followers, following int64, err error) {
	db.Model(&Follow{}).Where("following_id = ?", userID).Count(&followers)
	db.Model(&Follow{}).Where("follower_id = ?", userID).Count(&following)
	return followers, following, nil
}

// CreateStudyGroup creates a new study group
func CreateStudyGroup(db *gorm.DB, group *StudyGroup) error {
	group.ID = generateID()
	if err := db.Create(group).Error; err != nil {
		return err
	}
	
	// Add creator as admin member
	member := StudyGroupMember{
		ID:      generateID(),
		GroupID: group.ID,
		UserID:  group.CreatorID,
		Role:    "admin",
		Status:  "active",
		JoinedAt: time.Now(),
	}
	
	return db.Create(&member).Error
}

// JoinStudyGroup adds user to study group
func JoinStudyGroup(db *gorm.DB, groupID, userID string) error {
	// Check if already member
	var existingMember StudyGroupMember
	if err := db.Where("group_id = ? AND user_id = ?", groupID, userID).First(&existingMember).Error; err == nil {
		return gorm.ErrDuplicatedKey
	}
	
	member := StudyGroupMember{
		ID:       generateID(),
		GroupID:  groupID,
		UserID:   userID,
		Role:     "member",
		Status:   "active",
		JoinedAt: time.Now(),
	}
	
	if err := db.Create(&member).Error; err != nil {
		return err
	}
	
	// Update group member count
	db.Model(&StudyGroup{}).Where("id = ?", groupID).UpdateColumn("members_count", gorm.Expr("members_count + ?", 1))
	return nil
}

// LikeComment toggles like on a comment
func LikeComment(db *gorm.DB, userID, commentID string) (bool, error) {
	var like Like
	err := db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, "comment", commentID).First(&like).Error

	if err == gorm.ErrRecordNotFound {
		// Create new like
		like = Like{
			ID:         generateID(),
			UserID:     userID,
			EntityType: "comment",
			EntityID:   commentID,
		}
		if err := db.Create(&like).Error; err != nil {
			return false, err
		}

		// Remove dislike if exists
		db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, "comment", commentID).Delete(&Dislike{})

		// Update comment likes/dislikes count
		db.Model(&Comment{}).Where("id = ?", commentID).Updates(map[string]interface{}{
			"likes_count": gorm.Expr("likes_count + ?", 1),
			"dislikes_count": gorm.Expr("CASE WHEN dislikes_count > 0 THEN dislikes_count - 1 ELSE 0 END"),
		})
		return true, nil
	} else if err == nil {
		// Remove like
		if err := db.Delete(&like).Error; err != nil {
			return false, err
		}

		// Update comment likes count
		db.Model(&Comment{}).Where("id = ?", commentID).UpdateColumn("likes_count", gorm.Expr("CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END"))
		return false, nil
	}

	return false, err
}

// DislikeComment toggles dislike on a comment
func DislikeComment(db *gorm.DB, userID, commentID string) (bool, error) {
	var dislike Dislike
	err := db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, "comment", commentID).First(&dislike).Error

	if err == gorm.ErrRecordNotFound {
		// Create new dislike
		dislike = Dislike{
			ID:         generateID(),
			UserID:     userID,
			EntityType: "comment",
			EntityID:   commentID,
		}
		if err := db.Create(&dislike).Error; err != nil {
			return false, err
		}

		// Remove like if exists
		db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, "comment", commentID).Delete(&Like{})

		// Update comment likes/dislikes count
		db.Model(&Comment{}).Where("id = ?", commentID).Updates(map[string]interface{}{
			"dislikes_count": gorm.Expr("dislikes_count + ?", 1),
			"likes_count": gorm.Expr("CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END"),
		})
		return true, nil
	} else if err == nil {
		// Remove dislike
		if err := db.Delete(&dislike).Error; err != nil {
			return false, err
		}

		// Update comment dislikes count
		db.Model(&Comment{}).Where("id = ?", commentID).UpdateColumn("dislikes_count", gorm.Expr("CASE WHEN dislikes_count > 0 THEN dislikes_count - 1 ELSE 0 END"))
		return false, nil
	}

	return false, err
}