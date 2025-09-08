package services

import (
	"encoding/json"
	"math"
	"sort"
	"strings"
	"time"
	
	"pte-memory-backend/database"
	"pte-memory-backend/models"
)

type KnowledgeGraphService struct{}

func NewKnowledgeGraphService() *KnowledgeGraphService {
	return &KnowledgeGraphService{}
}

// UpdateMasteryLevel calculates new mastery level based on performance
func (kgs *KnowledgeGraphService) UpdateMasteryLevel(
	progress *models.UserKnowledgeProgress,
	isCorrect bool,
	confidenceLevel int,
) *models.UserKnowledgeProgress {
	progress.StudyCount++
	if isCorrect {
		progress.CorrectCount++
	}
	
	// Calculate base accuracy
	accuracy := float64(progress.CorrectCount) / float64(progress.StudyCount)
	
	// Apply confidence level adjustment (1-5 scale)
	confidenceAdjustment := float64(confidenceLevel) / 5.0
	
	// Calculate new mastery level using weighted formula
	newMastery := (accuracy * 0.7) + (confidenceAdjustment * 0.3)
	
	// Apply learning curve - faster improvement at the beginning
	if progress.MasteryLevel < 0.5 {
		newMastery = progress.MasteryLevel + (newMastery-progress.MasteryLevel)*1.2
	} else {
		newMastery = progress.MasteryLevel + (newMastery-progress.MasteryLevel)*0.8
	}
	
	// Ensure mastery level is between 0 and 1
	progress.MasteryLevel = math.Max(0, math.Min(1, newMastery))
	progress.LastStudied = time.Now()
	
	return progress
}

// GeneratePersonalizedPath creates a learning path based on user's current knowledge
func (kgs *KnowledgeGraphService) GeneratePersonalizedPath(
	userID string,
	goals []string,
	duration int,
	targetLevel int,
) (*models.LearningPath, error) {
	// Get user's current progress
	var currentProgress []models.UserKnowledgeProgress
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Node").Find(&currentProgress).Error; err != nil {
		return nil, err
	}
	
	// Find knowledge gaps based on goals
	var targetNodes []models.KnowledgeNode
	for _, goal := range goals {
		var nodes []models.KnowledgeNode
		database.DB.Where("category = ? OR name ILIKE ?", goal, "%"+goal+"%").Find(&nodes)
		targetNodes = append(targetNodes, nodes...)
	}
	
	// Create mastery map for quick lookup
	masteryMap := make(map[string]float64)
	for _, p := range currentProgress {
		masteryMap[p.NodeID] = p.MasteryLevel
	}
	
	// Sort nodes by priority (low mastery + high importance)
	sort.Slice(targetNodes, func(i, j int) bool {
		masteryI := masteryMap[targetNodes[i].ID]
		masteryJ := masteryMap[targetNodes[j].ID]
		
		// Priority = (1 - mastery) * level_importance
		priorityI := (1 - masteryI) * float64(targetNodes[i].Level)
		priorityJ := (1 - masteryJ) * float64(targetNodes[j].Level)
		
		return priorityI > priorityJ
	})
	
	// Limit nodes based on duration
	maxNodes := duration / 2 // Approximately 2 days per node
	if len(targetNodes) > maxNodes {
		targetNodes = targetNodes[:maxNodes]
	}
	
	// Convert to node IDs
	nodeIDs := make([]string, len(targetNodes))
	for i, node := range targetNodes {
		nodeIDs[i] = node.ID
	}
	
	nodeIDsJSON, _ := json.Marshal(nodeIDs)
	
	// Deactivate old learning paths
	database.DB.Model(&models.LearningPath{}).
		Where("user_id = ?", userID).
		Update("is_active", false)
	
	// Create new learning path
	learningPath := &models.LearningPath{
		UserID:      userID,
		Name:        "Personalized Learning Path",
		Description: "AI-generated path based on your knowledge gaps",
		NodeIDs:     string(nodeIDsJSON),
		IsActive:    true,
		Progress:    0,
	}
	
	if err := database.DB.Create(learningPath).Error; err != nil {
		return nil, err
	}
	
	return learningPath, nil
}

// RecommendQuestions suggests questions based on knowledge gaps
func (kgs *KnowledgeGraphService) RecommendQuestions(userID string, limit int) ([]models.Question, error) {
	// Get user's weak knowledge areas (low mastery)
	var weakAreas []models.UserKnowledgeProgress
	if err := database.DB.Where("user_id = ? AND mastery_level < 0.6", userID).
		Order("mastery_level ASC").
		Limit(5).
		Find(&weakAreas).Error; err != nil {
		return nil, err
	}
	
	if len(weakAreas) == 0 {
		// If no weak areas, recommend diverse questions
		var questions []models.Question
		if err := database.DB.Where("user_id = ?", userID).
			Order("RANDOM()").
			Limit(limit).
			Find(&questions).Error; err != nil {
			return nil, err
		}
		return questions, nil
	}
	
	// Find questions related to weak knowledge areas
	var questions []models.Question
	nodeIDs := make([]string, len(weakAreas))
	for i, area := range weakAreas {
		nodeIDs[i] = area.NodeID
	}
	
	if err := database.DB.Table("questions").
		Joins("JOIN question_knowledge_nodes ON questions.id = question_knowledge_nodes.question_id").
		Where("question_knowledge_nodes.node_id IN ? AND questions.user_id = ?", nodeIDs, userID).
		Order("question_knowledge_nodes.relevance DESC").
		Limit(limit).
		Find(&questions).Error; err != nil {
		return nil, err
	}
	
	return questions, nil
}

// AnalyzeQuestionContent suggests knowledge nodes for a question using simple NLP
func (kgs *KnowledgeGraphService) AnalyzeQuestionContent(questionText, questionType string) (map[string]interface{}, error) {
	text := strings.ToLower(questionText)
	
	// Get all knowledge nodes
	var nodes []models.KnowledgeNode
	if err := database.DB.Find(&nodes).Error; err != nil {
		return nil, err
	}
	
	// Simple keyword matching algorithm
	suggestions := []map[string]interface{}{}
	
	for _, node := range nodes {
		score := 0.0
		
		// Check category match
		if strings.EqualFold(node.Category, questionType) {
			score += 0.5
		}
		
		// Check keyword matches in node name and description
		nodeKeywords := strings.ToLower(node.Name + " " + node.Description)
		words := strings.Fields(text)
		
		matches := 0
		for _, word := range words {
			if len(word) > 3 && strings.Contains(nodeKeywords, word) {
				matches++
			}
		}
		
		if len(words) > 0 {
			score += float64(matches) / float64(len(words))
		}
		
		// Grammar pattern matching
		if node.NodeType == "grammar" {
			grammarPatterns := map[string][]string{
				"present tenses": {"is", "are", "am", "present"},
				"past tenses": {"was", "were", "past", "yesterday"},
				"future tenses": {"will", "shall", "future", "tomorrow"},
				"conditionals": {"if", "would", "could", "should"},
				"passive voice": {"by", "was done", "is made"},
			}
			
			if patterns, exists := grammarPatterns[strings.ToLower(node.Name)]; exists {
				for _, pattern := range patterns {
					if strings.Contains(text, pattern) {
						score += 0.3
					}
				}
			}
		}
		
		// Only include nodes with significant relevance
		if score > 0.3 {
			suggestions = append(suggestions, map[string]interface{}{
				"node_id":    node.ID,
				"node_name":  node.Name,
				"relevance":  score,
				"node_type":  node.NodeType,
				"category":   node.Category,
				"level":      node.Level,
			})
		}
	}
	
	// Sort by relevance
	sort.Slice(suggestions, func(i, j int) bool {
		return suggestions[i]["relevance"].(float64) > suggestions[j]["relevance"].(float64)
	})
	
	// Limit to top 5 suggestions
	if len(suggestions) > 5 {
		suggestions = suggestions[:5]
	}
	
	return map[string]interface{}{
		"suggested_nodes": suggestions,
		"auto_tags":       kgs.generateAutoTags(questionText),
		"difficulty":      kgs.estimateDifficulty(questionText),
	}, nil
}

// generateAutoTags creates tags from question text
func (kgs *KnowledgeGraphService) generateAutoTags(text string) []string {
	words := strings.Fields(strings.ToLower(text))
	tags := []string{}
	
	// PTE/IELTS specific keywords
	keywordMap := map[string]string{
		"listen": "listening",
		"hear": "listening", 
		"audio": "listening",
		"speak": "speaking",
		"say": "speaking",
		"pronunciation": "speaking",
		"read": "reading",
		"passage": "reading",
		"text": "reading",
		"write": "writing",
		"essay": "writing",
		"grammar": "grammar",
		"vocabulary": "vocabulary",
		"tense": "grammar",
		"verb": "grammar",
	}
	
	for _, word := range words {
		if tag, exists := keywordMap[word]; exists {
			tags = append(tags, tag)
		}
	}
	
	// Remove duplicates
	seen := make(map[string]bool)
	uniqueTags := []string{}
	for _, tag := range tags {
		if !seen[tag] {
			uniqueTags = append(uniqueTags, tag)
			seen[tag] = true
		}
	}
	
	return uniqueTags
}

// estimateDifficulty estimates question difficulty based on text complexity
func (kgs *KnowledgeGraphService) estimateDifficulty(text string) int {
	words := strings.Fields(text)
	sentences := strings.Split(text, ".")
	
	// Basic complexity metrics
	avgWordsPerSentence := float64(len(words)) / float64(len(sentences))
	avgWordLength := 0.0
	
	for _, word := range words {
		avgWordLength += float64(len(word))
	}
	avgWordLength /= float64(len(words))
	
	// Difficulty scoring
	difficulty := 1
	
	if len(words) > 20 {
		difficulty++
	}
	if avgWordLength > 6 {
		difficulty++
	}
	if avgWordsPerSentence > 15 {
		difficulty++
	}
	
	// Check for complex vocabulary
	complexWords := []string{"consequently", "furthermore", "nevertheless", "adequate", "comprehensive"}
	for _, complex := range complexWords {
		if strings.Contains(strings.ToLower(text), complex) {
			difficulty++
			break
		}
	}
	
	return int(math.Min(5, float64(difficulty)))
}

// GenerateKnowledgeInsights provides analysis of user's knowledge state
func (kgs *KnowledgeGraphService) GenerateKnowledgeInsights(userID string) (map[string]interface{}, error) {
	var progress []models.UserKnowledgeProgress
	if err := database.DB.Where("user_id = ?", userID).
		Preload("Node").Find(&progress).Error; err != nil {
		return nil, err
	}
	
	if len(progress) == 0 {
		return map[string]interface{}{
			"message": "Start learning to see your progress insights!",
		}, nil
	}
	
	// Calculate category strengths
	categoryStats := make(map[string]map[string]float64)
	
	for _, p := range progress {
		category := p.Node.Category
		if categoryStats[category] == nil {
			categoryStats[category] = map[string]float64{"total": 0, "mastery": 0, "count": 0}
		}
		
		categoryStats[category]["total"] += p.MasteryLevel
		categoryStats[category]["count"]++
	}
	
	// Calculate averages
	strengths := []map[string]interface{}{}
	weaknesses := []map[string]interface{}{}
	
	for category, stats := range categoryStats {
		avgMastery := stats["total"] / stats["count"]
		
		item := map[string]interface{}{
			"category": category,
			"mastery":  avgMastery,
			"count":    int(stats["count"]),
		}
		
		if avgMastery >= 0.7 {
			strengths = append(strengths, item)
		} else if avgMastery < 0.5 {
			weaknesses = append(weaknesses, item)
		}
	}
	
	// Overall statistics
	totalMastery := 0.0
	for _, p := range progress {
		totalMastery += p.MasteryLevel
	}
	overallMastery := totalMastery / float64(len(progress))
	
	return map[string]interface{}{
		"overall_mastery": overallMastery,
		"total_nodes":     len(progress),
		"strengths":       strengths,
		"weaknesses":      weaknesses,
		"recommendations": kgs.generateRecommendations(strengths, weaknesses),
	}, nil
}

// generateRecommendations creates personalized study recommendations
func (kgs *KnowledgeGraphService) generateRecommendations(strengths, weaknesses []map[string]interface{}) []string {
	recommendations := []string{}
	
	if len(weaknesses) > 0 {
		for _, weakness := range weaknesses {
			category := weakness["category"].(string)
			recommendations = append(recommendations, 
				"Focus on improving your "+category+" skills")
		}
	}
	
	if len(strengths) > 0 {
		recommendations = append(recommendations, 
			"Great progress! Keep practicing your strong areas to maintain proficiency")
	}
	
	if len(recommendations) == 0 {
		recommendations = append(recommendations, 
			"Continue your balanced learning approach across all skill areas")
	}
	
	return recommendations
}

// FindSimilarQuestions finds questions with overlapping knowledge nodes
func (kgs *KnowledgeGraphService) FindSimilarQuestions(questionID string, limit int) ([]map[string]interface{}, error) {
	// Get knowledge nodes for the source question
	var sourceNodes []models.QuestionKnowledgeNode
	if err := database.DB.Where("question_id = ?", questionID).Find(&sourceNodes).Error; err != nil {
		return nil, err
	}
	
	if len(sourceNodes) == 0 {
		return []map[string]interface{}{}, nil
	}
	
	// Find other questions sharing these nodes
	nodeIDs := make([]string, len(sourceNodes))
	for i, node := range sourceNodes {
		nodeIDs[i] = node.NodeID
	}
	
	var similarQuestions []struct {
		QuestionID string
		SharedNodes int
	}
	
	if err := database.DB.Table("question_knowledge_nodes").
		Select("question_id, COUNT(*) as shared_nodes").
		Where("node_id IN ? AND question_id != ?", nodeIDs, questionID).
		Group("question_id").
		Having("COUNT(*) > 0").
		Order("shared_nodes DESC").
		Limit(limit).
		Find(&similarQuestions).Error; err != nil {
		return nil, err
	}
	
	// Get full question details
	result := []map[string]interface{}{}
	for _, sim := range similarQuestions {
		var question models.Question
		if err := database.DB.First(&question, "id = ?", sim.QuestionID).Error; err == nil {
			similarity := float64(sim.SharedNodes) / float64(len(sourceNodes))
			result = append(result, map[string]interface{}{
				"question":   question,
				"similarity": similarity,
				"shared_nodes": sim.SharedNodes,
			})
		}
	}
	
	return result, nil
}