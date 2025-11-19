package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetStudyGroups 获取学习小组列表
// GET /api/study-groups?category=PTE&privacy=public&limit=20
func GetStudyGroups(c *gin.Context) {
	category := c.Query("category")
	privacy := c.Query("privacy")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	query := database.DB.Model(&models.StudyGroup{})

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if privacy != "" {
		query = query.Where("privacy = ?", privacy)
	}

	var total int64
	query.Count(&total)

	var groups []models.StudyGroup
	err := query.Preload("Creator").
		Order("member_count DESC").
		Limit(limit).
		Offset(offset).
		Find(&groups).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取小组失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"total":  total,
	})
}

// GetStudyGroup 获取小组详情
// GET /api/study-groups/:id
func GetStudyGroup(c *gin.Context) {
	groupID := c.Param("id")

	var group models.StudyGroup
	err := database.DB.Preload("Creator").
		Preload("Members").
		Preload("Members.User").
		First(&group, "id = ?", groupID).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "小组不存在"})
		return
	}

	c.JSON(http.StatusOK, group)
}

// CreateStudyGroup 创建学习小组
// POST /api/study-groups
func CreateStudyGroup(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		Name        string   `json:"name" binding:"required"`
		Description string   `json:"description"`
		Category    string   `json:"category" binding:"required"`
		Privacy     string   `json:"privacy"`
		MaxMembers  int      `json:"max_members"`
		Tags        []string `json:"tags"`
		Avatar      string   `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group := models.StudyGroup{
		Name:        input.Name,
		Description: input.Description,
		Category:    input.Category,
		Privacy:     input.Privacy,
		MaxMembers:  input.MaxMembers,
		Tags:        input.Tags,
		Avatar:      input.Avatar,
		CreatorID:   userID,
		MembersCount: 1, // 创建者自动成为成员
	}

	if group.Privacy == "" {
		group.Privacy = "public"
	}
	if group.MaxMembers == 0 {
		group.MaxMembers = 50
	}

	// 开始事务
	tx := database.DB.Begin()

	if err := tx.Create(&group).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	// 添加创建者为管理员
	member := models.StudyGroupMember{
		GroupID: group.ID,
		UserID:  userID,
		Role:    "admin",
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	// 创建关联的聊天室
	chatRoom := models.ChatRoom{
		Name:         group.Name,
		RoomType:     models.ChatRoomTypeStudyGroup,
		StudyGroupID: group.ID,
		MaxMembers:   group.MaxMembers,
		MemberCount:  1,
	}

	if err := tx.Create(&chatRoom).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, group)
}

// JoinStudyGroup 加入学习小组
// POST /api/study-groups/:id/join
func JoinStudyGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	// 检查小组
	var group models.StudyGroup
	if err := database.DB.First(&group, "id = ?", groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "小组不存在"})
		return
	}

	// 检查是否已加入
	var existing models.StudyGroupMember
	err := database.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&existing).Error
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "已是小组成员"})
		return
	}

	// 检查人数限制
	if group.MembersCount >= group.MaxMembers {
		c.JSON(http.StatusForbidden, gin.H{"error": "小组已满"})
		return
	}

	// 私密小组需要邀请
	if group.Privacy == "private" {
		c.JSON(http.StatusForbidden, gin.H{"error": "私密小组需要邀请"})
		return
	}

	// 创建成员记录
	member := models.StudyGroupMember{
		GroupID: groupID,
		UserID:  userID,
		Role:    "member",
	}

	tx := database.DB.Begin()

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "加入失败"})
		return
	}

	// 更新成员数
	tx.Model(&group).Update("member_count", group.MembersCount+1)

	// 加入小组聊天室
	var chatRoom models.ChatRoom
	if err := tx.Where("study_group_id = ?", groupID).First(&chatRoom).Error; err == nil {
		chatMember := models.ChatRoomMember{
			RoomID: chatRoom.ID,
			UserID: userID,
			Role:   models.ChatRoleMember,
		}
		tx.Create(&chatMember)
		tx.Model(&chatRoom).Update("member_count", chatRoom.MemberCount+1)
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "加入成功", "member": member})
}

// LeaveStudyGroup 离开学习小组
// POST /api/study-groups/:id/leave
func LeaveStudyGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	var member models.StudyGroupMember
	if err := database.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未加入该小组"})
		return
	}

	// 管理员不能直接离开
	if member.Role == "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "管理员需要先转让权限"})
		return
	}

	tx := database.DB.Begin()

	// 删除成员记录
	tx.Delete(&member)

	// 更新成员数
	tx.Model(&models.StudyGroup{}).Where("id = ?", groupID).
		Update("member_count", gorm.Expr("member_count - 1"))

	// 离开聊天室
	var chatRoom models.ChatRoom
	if err := tx.Where("study_group_id = ?", groupID).First(&chatRoom).Error; err == nil {
		tx.Where("room_id = ? AND user_id = ?", chatRoom.ID, userID).
			Delete(&models.ChatRoomMember{})
		tx.Model(&chatRoom).Update("member_count", gorm.Expr("member_count - 1"))
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "已离开小组"})
}

// GetStudyGroupPosts 获取小组帖子
// GET /api/study-groups/:id/posts
func GetStudyGroupPosts(c *gin.Context) {
	groupID := c.Param("id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	var posts []models.StudyGroupPost
	err := database.DB.Where("group_id = ?", groupID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取帖子失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"total": len(posts),
	})
}

// CreateStudyGroupPost 创建小组帖子
// POST /api/study-groups/:id/posts
func CreateStudyGroupPost(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	var input struct {
		Title   string   `json:"title" binding:"required"`
		Content string   `json:"content" binding:"required"`
		Tags    []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查是否是成员
	var member models.StudyGroupMember
	if err := database.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "未加入该小组"})
		return
	}

	post := models.StudyGroupPost{
		GroupID: groupID,
		UserID:  userID,
		Title:   input.Title,
		Content: input.Content,
		Tags:    input.Tags,
	}

	if err := database.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	database.DB.Preload("User").First(&post, post.ID)

	c.JSON(http.StatusCreated, post)
}

// GetMyStudyGroups 获取我的学习小组
// GET /api/study-groups/my
func GetMyStudyGroups(c *gin.Context) {
	userID := c.GetString("user_id")

	var members []models.StudyGroupMember
	err := database.DB.Where("user_id = ?", userID).
		Preload("Group").
		Preload("Group.Creator").
		Order("joined_at DESC").
		Find(&members).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取小组失败"})
		return
	}

	groups := make([]gin.H, len(members))
	for i, member := range members {
		groups[i] = gin.H{
			"group": member.Group,
			"role":  member.Role,
			"joined_at": member.JoinedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"total":  len(groups),
	})
}

// UpdateStudyGroup 更新小组信息
// PUT /api/study-groups/:id
func UpdateStudyGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	// 检查权限
	var member models.StudyGroupMember
	if err := database.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限"})
		return
	}

	if member.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有管理员可以修改"})
		return
	}

	var input struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		Privacy     string   `json:"privacy"`
		MaxMembers  int      `json:"max_members"`
		Tags        []string `json:"tags"`
		Avatar      string   `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Description != "" {
		updates["description"] = input.Description
	}
	if input.Privacy != "" {
		updates["privacy"] = input.Privacy
	}
	if input.MaxMembers > 0 {
		updates["max_members"] = input.MaxMembers
	}
	if len(input.Tags) > 0 {
		updates["tags"] = input.Tags
	}
	if input.Avatar != "" {
		updates["avatar"] = input.Avatar
	}

	if err := database.DB.Model(&models.StudyGroup{}).Where("id = ?", groupID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	var group models.StudyGroup
	database.DB.First(&group, "id = ?", groupID)

	c.JSON(http.StatusOK, group)
}

// DeleteStudyGroup 删除学习小组
// DELETE /api/study-groups/:id
func DeleteStudyGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	groupID := c.Param("id")

	// 检查权限
	var group models.StudyGroup
	if err := database.DB.First(&group, "id = ?", groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "小组不存在"})
		return
	}

	if group.CreatorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有创建者可以删除"})
		return
	}

	tx := database.DB.Begin()

	// 删除所有成员
	tx.Where("group_id = ?", groupID).Delete(&models.StudyGroupMember{})

	// 删除所有帖子
	tx.Where("group_id = ?", groupID).Delete(&models.StudyGroupPost{})

	// 删除关联聊天室
	tx.Where("study_group_id = ?", groupID).Delete(&models.ChatRoom{})

	// 删除小组
	tx.Delete(&group)

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
