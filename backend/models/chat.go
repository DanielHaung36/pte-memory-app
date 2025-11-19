package models

import (
	"time"

	"gorm.io/gorm"
)

// ChatRoom 聊天室
type ChatRoom struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null"`
	RoomType    string    `json:"room_type" gorm:"index"` // level/study_group/global
	Level       int       `json:"level" gorm:"index"` // 等级限制（level类型聊天室）
	MinLevel    int       `json:"min_level"` // 最低等级
	MaxLevel    int       `json:"max_level"` // 最高等级
	StudyGroupID string   `json:"study_group_id" gorm:"type:uuid;index"` // 学习小组ID

	// 聊天室设置
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	MaxMembers  int       `json:"max_members" gorm:"default:100"`
	Description string    `json:"description" gorm:"type:text"`
	Avatar      string    `json:"avatar"`

	// 统计
	MemberCount int       `json:"member_count" gorm:"default:0"`
	MessageCount int      `json:"message_count" gorm:"default:0"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联 - 添加外键定义
	Messages    []ChatMessage     `json:"messages,omitempty" gorm:"foreignKey:RoomID"`
	Members     []ChatRoomMember  `json:"members,omitempty" gorm:"foreignKey:RoomID"`
}

// ChatRoomMember 聊天室成员
type ChatRoomMember struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RoomID      string    `json:"room_id" gorm:"type:uuid;index;not null"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`
	Role        string    `json:"role" gorm:"default:member"` // admin/moderator/member
	IsMuted     bool      `json:"is_muted" gorm:"default:false"`
	IsBanned    bool      `json:"is_banned" gorm:"default:false"`
	LastReadAt  *time.Time `json:"last_read_at"` // 最后阅读时间
	JoinedAt    time.Time `json:"joined_at"`

	Room        ChatRoom  `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// ChatMessage 聊天消息
type ChatMessage struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	RoomID      string    `json:"room_id" gorm:"type:uuid;index;not null"`
	UserID      string    `json:"user_id" gorm:"type:uuid;index;not null"`

	// 消息内容
	Content     string    `json:"content" gorm:"type:text;not null"`
	MessageType string    `json:"message_type" gorm:"default:text"` // text/image/audio/system
	Attachments StringArray `json:"attachments" gorm:"type:text[]"` // 附件URL列表

	// 消息元数据
	IsEdited    bool      `json:"is_edited" gorm:"default:false"`
	IsDeleted   bool      `json:"is_deleted" gorm:"default:false"`
	ReplyToID   string    `json:"reply_to_id" gorm:"type:uuid"` // 回复的消息ID

	// 互动统计
	LikeCount   int       `json:"like_count" gorm:"default:0"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联 - 添加外键定义
	Room        ChatRoom  `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ReplyTo     *ChatMessage `json:"reply_to,omitempty" gorm:"foreignKey:ReplyToID"`
	Likes       []ChatMessageLike `json:"likes,omitempty" gorm:"foreignKey:MessageID"`
}

// ChatMessageLike 消息点赞
type ChatMessageLike struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	MessageID string    `json:"message_id" gorm:"type:uuid;index;not null"`
	UserID    string    `json:"user_id" gorm:"type:uuid;index;not null"`
	CreatedAt time.Time `json:"created_at"`

	Message   ChatMessage `json:"message,omitempty" gorm:"foreignKey:MessageID"`
	User      User        `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// PrivateChat 私聊会话
type PrivateChat struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	User1ID     string    `json:"user1_id" gorm:"type:uuid;index;not null"`
	User2ID     string    `json:"user2_id" gorm:"type:uuid;index;not null"`

	// 最后消息
	LastMessageID   string     `json:"last_message_id" gorm:"type:uuid"`
	LastMessageAt   *time.Time `json:"last_message_at"`

	// 未读计数
	User1UnreadCount int      `json:"user1_unread_count" gorm:"default:0"`
	User2UnreadCount int      `json:"user2_unread_count" gorm:"default:0"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联 - 添加外键定义
	User1       User             `json:"user1,omitempty" gorm:"foreignKey:User1ID"`
	User2       User             `json:"user2,omitempty" gorm:"foreignKey:User2ID"`
	Messages    []PrivateMessage `json:"messages,omitempty" gorm:"foreignKey:ChatID"`
}

// PrivateMessage 私聊消息
type PrivateMessage struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ChatID      string    `json:"chat_id" gorm:"type:uuid;index;not null"`
	SenderID    string    `json:"sender_id" gorm:"type:uuid;index;not null"`
	ReceiverID  string    `json:"receiver_id" gorm:"type:uuid;index;not null"`

	// 消息内容
	Content     string    `json:"content" gorm:"type:text;not null"`
	MessageType string    `json:"message_type" gorm:"default:text"` // text/image/audio
	Attachments StringArray `json:"attachments" gorm:"type:text[]"`

	// 状态
	IsRead      bool      `json:"is_read" gorm:"default:false"`
	ReadAt      *time.Time `json:"read_at"`
	IsDeleted   bool      `json:"is_deleted" gorm:"default:false"`

	CreatedAt   time.Time `json:"created_at"`

	// 关联 - 添加外键定义
	Chat        PrivateChat `json:"chat,omitempty" gorm:"foreignKey:ChatID"`
	Sender      User        `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Receiver    User        `json:"receiver,omitempty" gorm:"foreignKey:ReceiverID"`
}

// 聊天室类型常量
const (
	ChatRoomTypeLevel      = "level"       // 等级分组聊天室
	ChatRoomTypeStudyGroup = "study_group" // 学习小组聊天室
	ChatRoomTypeGlobal     = "global"      // 全局聊天室
)

// 成员角色常量
const (
	ChatRoleAdmin     = "admin"
	ChatRoleModerator = "moderator"
	ChatRoleMember    = "member"
)

// 消息类型常量
const (
	MessageTypeText   = "text"
	MessageTypeImage  = "image"
	MessageTypeAudio  = "audio"
	MessageTypeSystem = "system"
)