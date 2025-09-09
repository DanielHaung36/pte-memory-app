package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
)

type GameController struct{}

// GetGameStats 获取用户游戏统计
func (gc *GameController) GetGameStats(c *gin.Context) {
	// 临时移除认证检查
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/

	var stats struct {
		TotalGames     int     `json:"total_games"`
		TotalScore     int     `json:"total_score"`
		BestScore      int     `json:"best_score"`
		BestAccuracy   float64 `json:"best_accuracy"`
		FastestTime    int     `json:"fastest_time"`
		FavoriteGame   string  `json:"favorite_game"`
		Level          int     `json:"level"`
		XP             int     `json:"xp"`
	}

	// 从数据库实时计算统计数据
	userID := "00000000-0000-0000-0000-000000000001" // 临时固定UUID格式用户ID
	
	// 查询游戏会话统计
	var totalGames int64
	database.DB.Table("game_sessions").Where("user_id = ?", userID).Count(&totalGames)
	
	var totalScore, bestScore int
	database.DB.Table("game_sessions").Where("user_id = ?", userID).Select("COALESCE(SUM(score), 0)").Row().Scan(&totalScore)
	database.DB.Table("game_sessions").Where("user_id = ?", userID).Select("COALESCE(MAX(score), 0)").Row().Scan(&bestScore)
	
	var bestAccuracy float64
	database.DB.Table("game_sessions").Where("user_id = ? AND correct_answers > 0", userID).
		Select("COALESCE(MAX(CAST(correct_answers AS FLOAT) / CAST(questions_answered AS FLOAT) * 100), 0)").
		Row().Scan(&bestAccuracy)
	
	var fastestTime int
	database.DB.Table("game_sessions").Where("user_id = ? AND time_spent > 0", userID).
		Select("COALESCE(MIN(time_spent), 0)").Row().Scan(&fastestTime)
	
	// 获取用户等级和经验值
	var user models.User
	database.DB.Where("id = ?", userID).First(&user)
	
	stats = struct {
		TotalGames     int     `json:"total_games"`
		TotalScore     int     `json:"total_score"`
		BestScore      int     `json:"best_score"`
		BestAccuracy   float64 `json:"best_accuracy"`
		FastestTime    int     `json:"fastest_time"`
		FavoriteGame   string  `json:"favorite_game"`
		Level          int     `json:"level"`
		XP             int     `json:"xp"`
	}{
		TotalGames:   int(totalGames),
		TotalScore:   totalScore,
		BestScore:    bestScore,
		BestAccuracy: bestAccuracy,
		FastestTime:  fastestTime,
		FavoriteGame: "word_match", // 可以后续从数据库计算
		Level:        user.Level,
		XP:           user.XP,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Game stats retrieved successfully",
		"stats":   stats,
	})
}

// GetRecentGames 获取最近游戏记录
func (gc *GameController) GetRecentGames(c *gin.Context) {
	// 临时移除认证检查
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/

	// 从数据库获取真实的最近游戏数据
	userID := "00000000-0000-0000-0000-000000000001" // 临时固定UUID格式用户ID
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	gameSessions, err := models.GetRecentGameSessions(database.DB, userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve recent games"})
		return
	}
	
	// 转换为响应格式
	recentGames := make([]gin.H, 0, len(gameSessions))
	for _, session := range gameSessions {
		accuracy := 0.0
		if session.QuestionsAnswered > 0 {
			accuracy = float64(session.CorrectAnswers) / float64(session.QuestionsAnswered) * 100
		}
		
		recentGames = append(recentGames, gin.H{
			"id":           session.ID,
			"game_type":    session.GameType,
			"score":        session.Score,
			"accuracy":     accuracy,
			"time_spent":   session.TimeSpent,
			"completed_at": session.CreatedAt.Format(time.RFC3339),
			"combo_count":  session.ComboCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Recent games retrieved successfully",
		"recent_games": recentGames,
	})
}

// GetAchievements 获取用户成就
func (gc *GameController) GetAchievements(c *gin.Context) {
	// 临时移除认证检查
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/

	// 从数据库获取用户成就数据
	userID := "00000000-0000-0000-0000-000000000001" // 临时固定UUID格式用户ID
	
	dbAchievements, err := models.GetUserAchievements(database.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve achievements"})
		return
	}
	
	// 如果数据库为空，初始化默认成就
	if len(dbAchievements) == 0 {
		gc.initializeDefaultAchievements(userID)
		dbAchievements, _ = models.GetUserAchievements(database.DB, userID)
	}
	
	// 转换为响应格式
	achievements := make([]gin.H, 0, len(dbAchievements))
	for _, achievement := range dbAchievements {
		achData := gin.H{
			"id":          achievement.ID,
			"title":       achievement.Title,
			"description": achievement.Description,
			"icon":        achievement.Icon,
			"unlocked":    achievement.IsUnlocked,
		}
		
		if achievement.IsUnlocked && achievement.UnlockedAt != nil {
			achData["unlocked_at"] = achievement.UnlockedAt.Format(time.RFC3339)
		}
		
		if !achievement.IsUnlocked {
			achData["progress"] = achievement.Progress
			achData["target"] = achievement.Target
		}
		
		achievements = append(achievements, achData)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Achievements retrieved successfully",
		"achievements": achievements,
	})
}

// StartGameSession 开始游戏会话
func (gc *GameController) StartGameSession(c *gin.Context) {
	// 临时移除认证检查
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/

	var req struct {
		GameType string `json:"game_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建游戏会话
	sessionID := strconv.FormatInt(time.Now().UnixNano(), 10)
	
	c.JSON(http.StatusOK, gin.H{
		"message":    "Game session started successfully",
		"session_id": sessionID,
		"game_type":  req.GameType,
		"start_time": time.Now().Format(time.RFC3339),
	})
}

// CompleteGameSession 完成游戏会话
func (gc *GameController) CompleteGameSession(c *gin.Context) {
	// 临时移除认证检查
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/

	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	var req struct {
		Score       int     `json:"score" binding:"required"`
		Accuracy    float64 `json:"accuracy"`
		TimeSpent   int     `json:"time_spent"`
		ComboCount  int     `json:"combo_count"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 这里应该保存游戏结果到数据库
	// 计算经验值和等级提升
	xpGained := req.Score / 10 // 简单算法：分数除以10
	if req.Accuracy > 90 {
		xpGained += 50 // 高准确率奖励
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Game session completed successfully",
		"score":     req.Score,
		"xp_gained": xpGained,
		"session_id": sessionID,
	})
}

// GetWordPairs 获取单词配对游戏数据
func (gc *GameController) GetWordPairs(c *gin.Context) {
	// 临时移除认证检查以便测试
	/*
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	*/
	// 完整的PTE词汇库，按难度和类别分类
	wordPairs := []gin.H{
		// 基础学术词汇 (Level 1-2)
		{
			"id": "1",
			"english": "Analyze",
			"chinese": "分析",
			"difficulty": 2,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "high",
		},
		{
			"id": "2",
			"english": "Evaluate",
			"chinese": "评估",
			"difficulty": 2,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "high",
		},
		{
			"id": "3",
			"english": "Compare",
			"chinese": "比较",
			"difficulty": 1,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "very_high",
		},
		{
			"id": "4",
			"english": "Contrast",
			"chinese": "对比",
			"difficulty": 2,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "high",
		},
		{
			"id": "5",
			"english": "Define",
			"chinese": "定义",
			"difficulty": 1,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "very_high",
		},
		{
			"id": "6",
			"english": "Describe",
			"chinese": "描述",
			"difficulty": 1,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "very_high",
		},
		{
			"id": "7",
			"english": "Explain",
			"chinese": "解释",
			"difficulty": 1,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "very_high",
		},
		{
			"id": "8",
			"english": "Identify",
			"chinese": "识别",
			"difficulty": 2,
			"category": "academic_basic",
			"type": "verb",
			"frequency": "high",
		},

		// 中等学术词汇 (Level 3)
		{
			"id": "9",
			"english": "Comprehensive",
			"chinese": "全面的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "10",
			"english": "Significant",
			"chinese": "重要的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "11",
			"english": "Relevant",
			"chinese": "相关的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "12",
			"english": "Substantial",
			"chinese": "大量的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "medium",
		},
		{
			"id": "13",
			"english": "Adequate",
			"chinese": "足够的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "medium",
		},
		{
			"id": "14",
			"english": "Appropriate",
			"chinese": "合适的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "15",
			"english": "Consistent",
			"chinese": "一致的",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "16",
			"english": "Evidence",
			"chinese": "证据",
			"difficulty": 3,
			"category": "academic_intermediate",
			"type": "noun",
			"frequency": "very_high",
		},

		// 高级学术词汇 (Level 4-5)
		{
			"id": "17",
			"english": "Hypothesis",
			"chinese": "假设",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "noun",
			"frequency": "medium",
		},
		{
			"id": "18",
			"english": "Phenomenon",
			"chinese": "现象",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "noun",
			"frequency": "medium",
		},
		{
			"id": "19",
			"english": "Methodology",
			"chinese": "方法论",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "noun",
			"frequency": "medium",
		},
		{
			"id": "20",
			"english": "Empirical",
			"chinese": "经验的",
			"difficulty": 5,
			"category": "academic_advanced",
			"type": "adjective",
			"frequency": "low",
		},
		{
			"id": "21",
			"english": "Contemporary",
			"chinese": "当代的",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "adjective",
			"frequency": "medium",
		},
		{
			"id": "22",
			"english": "Subsequently",
			"chinese": "随后",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "adverb",
			"frequency": "medium",
		},
		{
			"id": "23",
			"english": "Nevertheless",
			"chinese": "然而",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "adverb",
			"frequency": "medium",
		},
		{
			"id": "24",
			"english": "Furthermore",
			"chinese": "此外",
			"difficulty": 4,
			"category": "academic_advanced",
			"type": "adverb",
			"frequency": "high",
		},

		// 商务词汇
		{
			"id": "25",
			"english": "Investment",
			"chinese": "投资",
			"difficulty": 2,
			"category": "business",
			"type": "noun",
			"frequency": "high",
		},
		{
			"id": "26",
			"english": "Revenue",
			"chinese": "收入",
			"difficulty": 3,
			"category": "business",
			"type": "noun",
			"frequency": "high",
		},
		{
			"id": "27",
			"english": "Strategy",
			"chinese": "策略",
			"difficulty": 2,
			"category": "business",
			"type": "noun",
			"frequency": "very_high",
		},
		{
			"id": "28",
			"english": "Implement",
			"chinese": "实施",
			"difficulty": 3,
			"category": "business",
			"type": "verb",
			"frequency": "high",
		},
		{
			"id": "29",
			"english": "Efficient",
			"chinese": "高效的",
			"difficulty": 2,
			"category": "business",
			"type": "adjective",
			"frequency": "high",
		},
		{
			"id": "30",
			"english": "Productivity",
			"chinese": "生产力",
			"difficulty": 3,
			"category": "business",
			"type": "noun",
			"frequency": "high",
		},

		// 科学词汇
		{
			"id": "31",
			"english": "Research",
			"chinese": "研究",
			"difficulty": 1,
			"category": "science",
			"type": "noun",
			"frequency": "very_high",
		},
		{
			"id": "32",
			"english": "Experiment",
			"chinese": "实验",
			"difficulty": 2,
			"category": "science",
			"type": "noun",
			"frequency": "high",
		},
		{
			"id": "33",
			"english": "Theory",
			"chinese": "理论",
			"difficulty": 2,
			"category": "science",
			"type": "noun",
			"frequency": "high",
		},
		{
			"id": "34",
			"english": "Variable",
			"chinese": "变量",
			"difficulty": 3,
			"category": "science",
			"type": "noun",
			"frequency": "medium",
		},
		{
			"id": "35",
			"english": "Correlation",
			"chinese": "关联",
			"difficulty": 4,
			"category": "science",
			"type": "noun",
			"frequency": "medium",
		},
		{
			"id": "36",
			"english": "Innovation",
			"chinese": "创新",
			"difficulty": 3,
			"category": "science",
			"type": "noun",
			"frequency": "high",
		},

		// 社会科学词汇
		{
			"id": "37",
			"english": "Community",
			"chinese": "社区",
			"difficulty": 1,
			"category": "social",
			"type": "noun",
			"frequency": "very_high",
		},
		{
			"id": "38",
			"english": "Society",
			"chinese": "社会",
			"difficulty": 1,
			"category": "social",
			"type": "noun",
			"frequency": "very_high",
		},
		{
			"id": "39",
			"english": "Culture",
			"chinese": "文化",
			"difficulty": 1,
			"category": "social",
			"type": "noun",
			"frequency": "very_high",
		},
		{
			"id": "40",
			"english": "Institution",
			"chinese": "机构",
			"difficulty": 3,
			"category": "social",
			"type": "noun",
			"frequency": "high",
		},
	}

	// 获取查询参数
	difficulty := c.Query("difficulty")   // 1-5
	category := c.Query("category")       // academic, business, science, social
	limit := c.DefaultQuery("limit", "20") // 默认返回20个
	
	// 根据参数过滤
	var filteredWords []gin.H
	for _, word := range wordPairs {
		include := true
		
		if difficulty != "" {
			if fmt.Sprint(word["difficulty"]) != difficulty {
				include = false
			}
		}
		
		if category != "" {
			wordCategory := fmt.Sprint(word["category"])
			if !strings.Contains(wordCategory, category) {
				include = false
			}
		}
		
		if include {
			filteredWords = append(filteredWords, word)
		}
	}
	
	// 限制返回数量
	if limitNum, err := strconv.Atoi(limit); err == nil && limitNum < len(filteredWords) {
		filteredWords = filteredWords[:limitNum]
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Word pairs retrieved successfully",
		"words": filteredWords,
		"total": len(filteredWords),
		"filters": gin.H{
			"difficulty": difficulty,
			"category": category,
			"limit": limit,
		},
	})
}

// initializeDefaultAchievements 初始化用户默认成就
func (gc *GameController) initializeDefaultAchievements(userID string) {
	defaultAchievements := []models.Achievement{
		{
			ID:              "first_game",
			UserID:         userID,
			AchievementType: "first_game",
			Title:          "初次体验",
			Description:    "完成第一个游戏",
			Icon:           "🎮",
			Progress:       0,
			Target:         1,
			IsUnlocked:     false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		},
		{
			ID:              "speed_master",
			UserID:         userID,
			AchievementType: "speed_master", 
			Title:          "速度大师",
			Description:    "在60秒内完成单词配对游戏",
			Icon:           "⚡",
			Progress:       0,
			Target:         1,
			IsUnlocked:     false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		},
		{
			ID:              "accuracy_expert",
			UserID:         userID,
			AchievementType: "accuracy_expert",
			Title:          "准确专家", 
			Description:    "达到90%以上准确率",
			Icon:           "🎯",
			Progress:       0,
			Target:         1,
			IsUnlocked:     false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		},
		{
			ID:              "combo_king",
			UserID:         userID,
			AchievementType: "combo_king",
			Title:          "连击之王",
			Description:    "达到20次连击",
			Icon:           "👑",
			Progress:       0,
			Target:         20,
			IsUnlocked:     false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		},
	}
	
	// 批量创建成就
	for _, achievement := range defaultAchievements {
		database.DB.Create(&achievement)
	}
}