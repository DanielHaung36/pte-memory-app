package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
)

type ShopController struct{}

// GetShopItems 获取商店物品列表
func (sc *ShopController) GetShopItems(c *gin.Context) {
	category := c.Query("category")
	rarity := c.Query("rarity")
	limitStr := c.Query("limit")
	offsetStr := c.Query("offset")

	// 设置默认值
	limit := 50
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// 构建查询
	query := database.DB.Where("is_active = ?", true)

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if rarity != "" && rarity != "all" {
		query = query.Where("rarity = ?", rarity)
	}

	// 获取物品列表
	var items []models.ShopItem
	var total int64

	// 计算总数
	if err := query.Model(&models.ShopItem{}).Count(&total).Error; err != nil {
		log.Printf("Error counting shop items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取商店物品失败"})
		return
	}

	// 获取物品数据
	if err := query.Limit(limit).Offset(offset).Order("rarity DESC, price ASC").Find(&items).Error; err != nil {
		log.Printf("Error fetching shop items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取商店物品失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetUserInventory 获取用户库存
func (sc *ShopController) GetUserInventory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	var inventory []models.UserInventory
	if err := database.DB.Preload("Item").Where("user_id = ? AND quantity > 0", userID).Find(&inventory).Error; err != nil {
		log.Printf("Error fetching user inventory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户库存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"inventory": inventory,
	})
}

// PurchaseItem 购买物品
func (sc *ShopController) PurchaseItem(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "物品ID不能为空"})
		return
	}

	// 获取物品信息
	var item models.ShopItem
	if err := database.DB.First(&item, "id = ?", itemID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "物品不存在"})
		} else {
			log.Printf("Error fetching shop item: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取物品信息失败"})
		}
		return
	}

	// 检查物品是否可用
	if !item.IsAvailable() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "物品暂时不可购买"})
		return
	}

	// 获取用户信息
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		log.Printf("Error fetching user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
		return
	}

	// 检查用户积分是否足够
	if user.XP < item.Price {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "积分不足",
			"required": item.Price,
			"current": user.XP,
		})
		return
	}

	// 检查用户是否已拥有该物品（对于非消耗品）
	if item.Category != "boosts" {
		var existingInventory models.UserInventory
		if err := database.DB.Where("user_id = ? AND item_id = ?", userID, itemID).First(&existingInventory).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "您已拥有此物品"})
			return
		}
	}

	// 开始事务
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 扣除用户积分
	if err := tx.Model(&user).Update("xp", user.XP-item.Price).Error; err != nil {
		tx.Rollback()
		log.Printf("Error updating user XP: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "扣除积分失败"})
		return
	}

	// 添加到用户库存
	inventory := models.UserInventory{
		UserID:      userID.(string),
		ItemID:      itemID,
		Quantity:    1,
		PurchasedAt: time.Now(),
	}

	if err := tx.Create(&inventory).Error; err != nil {
		tx.Rollback()
		log.Printf("Error creating user inventory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "添加物品到库存失败"})
		return
	}

	// 添加购买记录
	history := models.PurchaseHistory{
		UserID:   userID.(string),
		ItemID:   itemID,
		Price:    item.Price,
		Quantity: 1,
		Status:   "completed",
	}

	if err := tx.Create(&history).Error; err != nil {
		tx.Rollback()
		log.Printf("Error creating purchase history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "记录购买历史失败"})
		return
	}

	// 更新商店物品库存（如果是限量商品）
	if item.StockCount > 0 {
		if err := tx.Model(&item).Update("stock_count", item.StockCount-1).Error; err != nil {
			tx.Rollback()
			log.Printf("Error updating item stock: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新商品库存失败"})
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "购买失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "购买成功",
		"item": item,
		"remaining_xp": user.XP - item.Price,
	})
}

// GetPurchaseHistory 获取购买历史
func (sc *ShopController) GetPurchaseHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	limitStr := c.Query("limit")
	offsetStr := c.Query("offset")

	limit := 20
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	var history []models.PurchaseHistory
	var total int64

	// 计算总数
	if err := database.DB.Model(&models.PurchaseHistory{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		log.Printf("Error counting purchase history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取购买历史失败"})
		return
	}

	// 获取购买历史
	if err := database.DB.Preload("Item").Where("user_id = ?", userID).
		Limit(limit).Offset(offset).Order("created_at DESC").Find(&history).Error; err != nil {
		log.Printf("Error fetching purchase history: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取购买历史失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// UseItem 使用物品
func (sc *ShopController) UseItem(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "物品ID不能为空"})
		return
	}

	// 获取用户库存中的物品
	var inventory models.UserInventory
	if err := database.DB.Preload("Item").Where("user_id = ? AND item_id = ?", userID, itemID).First(&inventory).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "您未拥有此物品"})
		} else {
			log.Printf("Error fetching user inventory: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取库存物品失败"})
		}
		return
	}

	if inventory.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "物品数量不足"})
		return
	}

	// 根据物品类型执行不同的使用逻辑
	switch inventory.Item.Category {
	case "themes", "avatars", "badges":
		// 装饰类物品 - 激活/取消激活
		newActiveState := !inventory.IsActive
		if err := database.DB.Model(&inventory).Update("is_active", newActiveState).Error; err != nil {
			log.Printf("Error updating inventory active state: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用物品失败"})
			return
		}

		status := "已激活"
		if !newActiveState {
			status = "已取消激活"
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "物品" + status,
			"is_active": newActiveState,
		})

	case "boosts":
		// 消耗品 - 扣除数量并应用增益效果
		boostService := services.NewBoostService(database.DB)

		// 应用道具效果
		effect, err := boostService.ApplyBoostEffect(userID.(string), itemID, &inventory.Item)
		if err != nil {
			log.Printf("Error applying boost effect: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "应用道具效果失败: " + err.Error()})
			return
		}

		// 扣除库存数量
		if err := database.DB.Model(&inventory).Update("quantity", inventory.Quantity-1).Error; err != nil {
			log.Printf("Error updating inventory quantity: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新库存失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "道具使用成功",
			"remaining_quantity": inventory.Quantity - 1,
			"effect": effect,
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "此物品不可使用"})
	}
}

// GetUserTheme 获取用户当前主题设置
func (sc *ShopController) GetUserTheme(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	var userTheme models.UserTheme
	if err := database.DB.Where("user_id = ?", userID).First(&userTheme).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果用户没有主题设置，返回默认设置
			c.JSON(http.StatusOK, gin.H{
				"theme": gin.H{
					"theme_id":  "default",
					"avatar_id": "default",
					"badge_ids": []string{},
				},
			})
		} else {
			log.Printf("Error fetching user theme: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取主题设置失败"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"theme": userTheme,
	})
}

// UpdateUserTheme 更新用户主题设置
func (sc *ShopController) UpdateUserTheme(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	var req struct {
		ThemeID  string   `json:"theme_id"`
		AvatarID string   `json:"avatar_id"`
		BadgeIDs []string `json:"badge_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 检查用户是否拥有这些物品
	if err := sc.validateUserOwnsItems(userID.(string), req.ThemeID, req.AvatarID, req.BadgeIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新或创建用户主题设置
	var userTheme models.UserTheme
	err := database.DB.Where("user_id = ?", userID).First(&userTheme).Error
	
	if err == gorm.ErrRecordNotFound {
		// 创建新的主题设置
		userTheme = models.UserTheme{
			UserID:   userID.(string),
			ThemeID:  req.ThemeID,
			AvatarID: req.AvatarID,
			BadgeIDs: req.BadgeIDs,
		}
		if err := database.DB.Create(&userTheme).Error; err != nil {
			log.Printf("Error creating user theme: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "保存主题设置失败"})
			return
		}
	} else if err != nil {
		log.Printf("Error fetching user theme: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取主题设置失败"})
		return
	} else {
		// 更新现有主题设置
		userTheme.ThemeID = req.ThemeID
		userTheme.AvatarID = req.AvatarID
		userTheme.BadgeIDs = req.BadgeIDs
		
		if err := database.DB.Save(&userTheme).Error; err != nil {
			log.Printf("Error updating user theme: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新主题设置失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "主题设置更新成功",
		"theme": userTheme,
	})
}

// validateUserOwnsItems 验证用户是否拥有指定的装饰物品
func (sc *ShopController) validateUserOwnsItems(userID, themeID, avatarID string, badgeIDs []string) error {
	// 收集所有需要验证的物品ID
	itemsToValidate := []string{}

	if themeID != "" && themeID != "default" {
		itemsToValidate = append(itemsToValidate, themeID)
	}

	if avatarID != "" && avatarID != "default" {
		itemsToValidate = append(itemsToValidate, avatarID)
	}

	for _, badgeID := range badgeIDs {
		if badgeID != "" {
			itemsToValidate = append(itemsToValidate, badgeID)
		}
	}

	if len(itemsToValidate) == 0 {
		return nil // 没有需要验证的物品
	}

	// 查询用户库存中的物品
	var inventory []models.UserInventory
	err := database.DB.Where("user_id = ? AND item_id IN ? AND quantity > 0",
		userID, itemsToValidate).Find(&inventory).Error

	if err != nil {
		return fmt.Errorf("查询用户库存失败")
	}

	// 创建拥有的物品ID映射
	ownedItems := make(map[string]bool)
	for _, item := range inventory {
		ownedItems[item.ItemID] = true
	}

	// 检查每个需要的物品是否拥有
	for _, itemID := range itemsToValidate {
		if !ownedItems[itemID] {
			// 查询物品名称用于错误信息
			var shopItem models.ShopItem
			database.DB.First(&shopItem, "id = ?", itemID)
			return fmt.Errorf("您还未拥有物品：%s", shopItem.Name)
		}
	}

	return nil
}