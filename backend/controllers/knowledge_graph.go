package controllers

import (
	"net/http"
	"strconv"
	
	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
)

// GetKnowledgeGraph returns the complete knowledge graph or filtered by category
func GetKnowledgeGraph(c *gin.Context) {
	category := c.Query("category")
	nodeType := c.Query("type")
	level := c.Query("level")
	
	var nodes []models.KnowledgeNode
	query := database.DB.Model(&models.KnowledgeNode{})
	
	// Apply filters
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if nodeType != "" {
		query = query.Where("node_type = ?", nodeType)
	}
	if level != "" {
		if levelInt, err := strconv.Atoi(level); err == nil {
			query = query.Where("level = ?", levelInt)
		}
	}
	
	// Include related edges
	if err := query.Preload("ParentEdges").Preload("ChildEdges").Find(&nodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch knowledge graph"})
		return
	}
	
	// Get all edges for the graph
	var edges []models.KnowledgeEdge
	if err := database.DB.Find(&edges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch knowledge edges"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"nodes": nodes,
		"edges": edges,
	})
}

// GetUserKnowledgeProgress returns user's progress on all knowledge nodes
func GetUserKnowledgeProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var progress []models.UserKnowledgeProgress
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Node").
		Find(&progress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user progress"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"progress": progress})
}

// UpdateUserKnowledgeProgress updates user's mastery level for a knowledge node
func UpdateUserKnowledgeProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	nodeID := c.Param("nodeId")
	
	var request struct {
		IsCorrect       bool `json:"is_correct"`
		ConfidenceLevel int  `json:"confidence_level"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	
	// Get or create progress record
	var progress models.UserKnowledgeProgress
	result := database.DB.Where("user_id = ? AND node_id = ?", userID, nodeID).First(&progress)
	
	if result.Error != nil {
		// Create new progress record
		progress = models.UserKnowledgeProgress{
			UserID:       userID,
			NodeID:       nodeID,
			MasteryLevel: 0,
			StudyCount:   0,
			CorrectCount: 0,
		}
	}
	
	// Update progress based on performance
	kgService := services.NewKnowledgeGraphService()
	updatedProgress := kgService.UpdateMasteryLevel(&progress, request.IsCorrect, request.ConfidenceLevel)
	
	// Save to database
	if err := database.DB.Save(updatedProgress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update progress"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"progress": updatedProgress})
}

// GetLearningPath returns user's active learning path
func GetLearningPath(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var learningPath models.LearningPath
	if err := database.DB.Where("user_id = ? AND is_active = true", userID).First(&learningPath).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active learning path found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"learning_path": learningPath})
}

// GenerateLearningPath creates a personalized learning path for the user
func GenerateLearningPath(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var request struct {
		Goals    []string `json:"goals"`    // target skills/topics
		Duration int      `json:"duration"` // days
		Level    int      `json:"level"`    // target difficulty level
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	
	kgService := services.NewKnowledgeGraphService()
	learningPath, err := kgService.GeneratePersonalizedPath(userID, request.Goals, request.Duration, request.Level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate learning path"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"learning_path": learningPath})
}

// GetRecommendedQuestions returns questions recommended based on knowledge gaps
func GetRecommendedQuestions(c *gin.Context) {
	userID := c.GetString("user_id")
	limit := 10
	
	if limitParam := c.Query("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil {
			limit = l
		}
	}
	
	kgService := services.NewKnowledgeGraphService()
	questions, err := kgService.RecommendQuestions(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"recommended_questions": questions})
}

// AnalyzeQuestionKnowledge analyzes a question and suggests knowledge node associations
func AnalyzeQuestionKnowledge(c *gin.Context) {
	var request struct {
		QuestionText string `json:"question_text"`
		QuestionType string `json:"question_type"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	
	kgService := services.NewKnowledgeGraphService()
	analysis, err := kgService.AnalyzeQuestionContent(request.QuestionText, request.QuestionType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze question"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"analysis": analysis})
}

// GetKnowledgeInsights provides insights about user's knowledge strengths and gaps
func GetKnowledgeInsights(c *gin.Context) {
	userID := c.GetString("user_id")
	
	kgService := services.NewKnowledgeGraphService()
	insights, err := kgService.GenerateKnowledgeInsights(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate insights"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"insights": insights})
}

// GetSimilarQuestions finds similar questions based on knowledge node overlap
func GetSimilarQuestions(c *gin.Context) {
	questionID := c.Param("questionId")
	limit := 5
	
	if limitParam := c.Query("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil {
			limit = l
		}
	}
	
	kgService := services.NewKnowledgeGraphService()
	similarQuestions, err := kgService.FindSimilarQuestions(questionID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find similar questions"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"similar_questions": similarQuestions})
}