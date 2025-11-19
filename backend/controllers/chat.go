package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"pte-memory-backend/websocket"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ChatController struct {
	wsHub *websocket.Hub
}

func NewChatController(hub *websocket.Hub) *ChatController {
	return &ChatController{wsHub: hub}
}

// GetLevelChatRooms 获取等级聊天室列表
// GET /api/chat/rooms/level
func (ctrl *ChatController) GetLevelChatRooms(c *gin.Context) {
	userID := c.GetString("user_id")

	// 获取用户等级
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 查找适合用户等级的聊天室
	var rooms []models.ChatRoom
	err := database.DB.Where("room_type = ? AND is_active = ? AND min_level <= ? AND max_level >= ?",
		models.ChatRoomTypeLevel, true, user.Level, user.Level).
		Order("level ASC").
		Find(&rooms).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取聊天室失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms":      rooms,
		"user_level": user.Level,
	})
}

// JoinChatRoom 加入聊天室
// POST /api/chat/rooms/:id/join
func (ctrl *ChatController) JoinChatRoom(c *gin.Context) {
	userID := c.GetString("user_id")
	roomID := c.Param("id")

	// 检查聊天室
	var room models.ChatRoom
	if err := database.DB.First(&room, "id = ?", roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "聊天室不存在"})
		return
	}

	// 检查用户等级权限
	var user models.User
	database.DB.First(&user, "id = ?", userID)

	if room.RoomType == models.ChatRoomTypeLevel {
		if user.Level < room.MinLevel || user.Level > room.MaxLevel {
			c.JSON(http.StatusForbidden, gin.H{"error": "等级不符合要求"})
			return
		}
	}

	// 检查是否已加入
	var existing models.ChatRoomMember
	err := database.DB.Where("room_id = ? AND user_id = ?", roomID, userID).First(&existing).Error
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "已在聊天室中", "member": existing})
		return
	}

	// 检查人数限制
	if room.MemberCount >= room.MaxMembers {
		c.JSON(http.StatusForbidden, gin.H{"error": "聊天室已满"})
		return
	}

	// 创建成员记录
	member := models.ChatRoomMember{
		RoomID: roomID,
		UserID: userID,
		Role:   models.ChatRoleMember,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "加入失败"})
		return
	}

	// 更新成员数
	database.DB.Model(&room).Update("member_count", room.MemberCount+1)

	// 发送系统消息
	systemMsg := models.ChatMessage{
		RoomID:      roomID,
		UserID:      userID,
		Content:     user.Username + " 加入了聊天室",
		MessageType: models.MessageTypeSystem,
	}
	database.DB.Create(&systemMsg)

	// WebSocket广播
	ctrl.wsHub.BroadcastToRoom(roomID, "user_joined", gin.H{
		"user_id":  userID,
		"username": user.Username,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "加入成功",
		"member":  member,
	})
}

// LeaveChatRoom 离开聊天室
// POST /api/chat/rooms/:id/leave
func (ctrl *ChatController) LeaveChatRoom(c *gin.Context) {
	userID := c.GetString("user_id")
	roomID := c.Param("id")

	var member models.ChatRoomMember
	if err := database.DB.Where("room_id = ? AND user_id = ?", roomID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未加入该聊天室"})
		return
	}

	// 删除成员记录
	database.DB.Delete(&member)

	// 更新成员数
	database.DB.Model(&models.ChatRoom{}).Where("id = ?", roomID).
		Update("member_count", gorm.Expr("member_count - 1"))

	c.JSON(http.StatusOK, gin.H{"message": "已离开聊天室"})
}

// GetChatMessages 获取聊天消息
// GET /api/chat/rooms/:id/messages?limit=50&before=messageID
func (ctrl *ChatController) GetChatMessages(c *gin.Context) {
	roomID := c.Param("id")
	limitStr := c.DefaultQuery("limit", "50")
	beforeID := c.Query("before")

	limit, _ := strconv.Atoi(limitStr)
	if limit > 100 {
		limit = 100
	}

	query := database.DB.Where("room_id = ? AND is_deleted = ?", roomID, false).
		Preload("User").
		Preload("ReplyTo").
		Order("created_at DESC")

	if beforeID != "" {
		var beforeMsg models.ChatMessage
		if err := database.DB.First(&beforeMsg, "id = ?", beforeID).Error; err == nil {
			query = query.Where("created_at < ?", beforeMsg.CreatedAt)
		}
	}

	var messages []models.ChatMessage
	if err := query.Limit(limit).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取消息失败"})
		return
	}

	// 反转顺序（最旧的在前）
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
	})
}

// SendChatMessage 发送聊天消息
// POST /api/chat/rooms/:id/messages
func (ctrl *ChatController) SendChatMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	roomID := c.Param("id")

	var input struct {
		Content     string   `json:"content" binding:"required"`
		MessageType string   `json:"message_type"`
		ReplyToID   string   `json:"reply_to_id"`
		Attachments []string `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查是否是成员
	var member models.ChatRoomMember
	if err := database.DB.Where("room_id = ? AND user_id = ?", roomID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "未加入聊天室"})
		return
	}

	// 检查是否被禁言
	if member.IsMuted {
		c.JSON(http.StatusForbidden, gin.H{"error": "你已被禁言"})
		return
	}

	// 创建消息
	message := models.ChatMessage{
		RoomID:      roomID,
		UserID:      userID,
		Content:     input.Content,
		MessageType: input.MessageType,
		ReplyToID:   input.ReplyToID,
		Attachments: input.Attachments,
	}

	if message.MessageType == "" {
		message.MessageType = models.MessageTypeText
	}

	if err := database.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送失败"})
		return
	}

	// 加载用户信息
	database.DB.Preload("User").First(&message, message.ID)

	// 更新消息计数
	database.DB.Model(&models.ChatRoom{}).Where("id = ?", roomID).
		Update("message_count", gorm.Expr("message_count + 1"))

	// WebSocket广播
	ctrl.wsHub.BroadcastToRoom(roomID, "new_message", message)

	c.JSON(http.StatusOK, message)
}

// GetPrivateChats 获取私聊列表
// GET /api/chat/private
func (ctrl *ChatController) GetPrivateChats(c *gin.Context) {
	userID := c.GetString("user_id")

	var chats []models.PrivateChat
	err := database.DB.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").
		Preload("User2").
		Order("last_message_at DESC NULLS LAST").
		Find(&chats).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取私聊失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"chats": chats,
		"total": len(chats),
	})
}

// StartPrivateChat 开始私聊
// POST /api/chat/private/start
func (ctrl *ChatController) StartPrivateChat(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		TargetUserID string `json:"target_user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if userID == input.TargetUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能和自己聊天"})
		return
	}

	// 检查是否已存在
	var existing models.PrivateChat
	err := database.DB.Where("(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		userID, input.TargetUserID, input.TargetUserID, userID).
		First(&existing).Error

	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "已存在聊天",
			"chat":    existing,
		})
		return
	}

	// 创建新聊天
	chat := models.PrivateChat{
		User1ID: userID,
		User2ID: input.TargetUserID,
	}

	if err := database.DB.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	database.DB.Preload("User1").Preload("User2").First(&chat, chat.ID)

	c.JSON(http.StatusOK, chat)
}

// SendPrivateMessage 发送私信
// POST /api/chat/private/:chatId/messages
func (ctrl *ChatController) SendPrivateMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	chatID := c.Param("chatId")

	var input struct {
		Content     string   `json:"content" binding:"required"`
		MessageType string   `json:"message_type"`
		Attachments []string `json:"attachments"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查聊天
	var chat models.PrivateChat
	if err := database.DB.First(&chat, "id = ?", chatID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "聊天不存在"})
		return
	}

	// 确定接收者
	var receiverID string
	if chat.User1ID == userID {
		receiverID = chat.User2ID
	} else if chat.User2ID == userID {
		receiverID = chat.User1ID
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限"})
		return
	}

	// 创建消息
	message := models.PrivateMessage{
		ChatID:      chatID,
		SenderID:    userID,
		ReceiverID:  receiverID,
		Content:     input.Content,
		MessageType: input.MessageType,
		Attachments: input.Attachments,
	}

	if message.MessageType == "" {
		message.MessageType = models.MessageTypeText
	}

	if err := database.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送失败"})
		return
	}

	// 更新聊天
	now := time.Now()
	updates := map[string]interface{}{
		"last_message_id": message.ID,
		"last_message_at": now,
	}
	if chat.User1ID == receiverID {
		updates["user1_unread_count"] = gorm.Expr("user1_unread_count + 1")
	} else {
		updates["user2_unread_count"] = gorm.Expr("user2_unread_count + 1")
	}
	database.DB.Model(&chat).Updates(updates)

	// WebSocket推送给接收者
	ctrl.wsHub.SendToUser(receiverID, "new_private_message", message)

	c.JSON(http.StatusOK, message)
}

// GetPrivateMessages 获取私聊消息
// GET /api/chat/private/:chatId/messages
func (ctrl *ChatController) GetPrivateMessages(c *gin.Context) {
	userID := c.GetString("user_id")
	chatID := c.Param("chatId")
	limitStr := c.DefaultQuery("limit", "50")

	limit, _ := strconv.Atoi(limitStr)

	// 检查权限
	var chat models.PrivateChat
	if err := database.DB.First(&chat, "id = ?", chatID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "聊天不存在"})
		return
	}

	if chat.User1ID != userID && chat.User2ID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限"})
		return
	}

	var messages []models.PrivateMessage
	database.DB.Where("chat_id = ?", chatID).
		Preload("Sender").
		Order("created_at DESC").
		Limit(limit).
		Find(&messages)

	// 标记为已读
	database.DB.Model(&models.PrivateMessage{}).
		Where("chat_id = ? AND receiver_id = ? AND is_read = ?", chatID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": time.Now(),
		})

	// 重置未读计数
	if chat.User1ID == userID {
		database.DB.Model(&chat).Update("user1_unread_count", 0)
	} else {
		database.DB.Model(&chat).Update("user2_unread_count", 0)
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
	})
}
