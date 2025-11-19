package services

import (
	"fmt"
	"math"
	"time"
	"pte-memory-backend/models"
)

// EbbinghausService handles spaced repetition algorithm
type EbbinghausService struct{}

// NewEbbinghausService creates a new instance of EbbinghausService
func NewEbbinghausService() *EbbinghausService {
	return &EbbinghausService{}
}

// ReviewResult represents the result of a review session
type ReviewResult struct {
	IsCorrect       bool
	ConfidenceLevel int     // 1-5 scale
	ResponseTime    int     // milliseconds
	StreakCount     int
}

// CalculateNextReview implements the SM-2 algorithm with Ebbinghaus enhancements
func (es *EbbinghausService) CalculateNextReview(schedule *models.ReviewSchedule, result ReviewResult) (*models.ReviewSchedule, error) {
	newSchedule := *schedule // Copy the schedule
	
	if result.IsCorrect {
		// Successful review - increase interval
		newSchedule.RepetitionCount++
		
		var newInterval int
		if newSchedule.RepetitionCount == 1 {
			newInterval = 1 // First review after 1 day
		} else if newSchedule.RepetitionCount == 2 {
			newInterval = 2 // Second review after 2 days
		} else if newSchedule.RepetitionCount == 3 {
			newInterval = 4 // Third review after 4 days
		} else {
			// Use ease factor for subsequent reviews
			newInterval = int(math.Ceil(float64(newSchedule.CurrentInterval) * newSchedule.EaseFactor))
		}
		
		// Apply streak bonus
		streakMultiplier := es.getStreakMultiplier(result.StreakCount)
		if streakMultiplier > 1 {
			newInterval = int(float64(newInterval) * streakMultiplier)
		}
		
		newSchedule.CurrentInterval = newInterval
		
		// Adjust ease factor based on confidence (SM-2 algorithm)
		quality := float64(result.ConfidenceLevel) // 1-5 scale
		newEaseFactor := newSchedule.EaseFactor + (0.1 - (5-quality)*(0.08+(5-quality)*0.02))
		if newEaseFactor < 1.3 {
			newEaseFactor = 1.3
		}
		newSchedule.EaseFactor = newEaseFactor
		
	} else {
		// Failed review - reset to beginning with penalty
		newSchedule.RepetitionCount = 0
		newSchedule.CurrentInterval = 1 // Start over with 1 day
		newSchedule.EaseFactor = math.Max(1.3, newSchedule.EaseFactor-0.2) // Reduce ease factor
	}
	
	// Calculate next review date
	now := time.Now()
	newSchedule.NextReviewDate = now.AddDate(0, 0, newSchedule.CurrentInterval)
	newSchedule.LastReviewDate = &now
	
	// Update mastery status
	newSchedule.IsMastered = es.isQuestionMastered(&newSchedule)
	if newSchedule.IsMastered {
		newSchedule.IsCompleted = true
	}
	
	// Update priority based on performance
	newSchedule.Priority = es.calculatePriority(&newSchedule, result)
	
	return &newSchedule, nil
}

// getStreakMultiplier returns multiplier based on streak count
func (es *EbbinghausService) getStreakMultiplier(streakCount int) float64 {
	if streakCount >= 20 {
		return 1.5
	} else if streakCount >= 10 {
		return 1.3
	} else if streakCount >= 5 {
		return 1.2
	} else if streakCount >= 3 {
		return 1.1
	}
	return 1.0
}

// isQuestionMastered determines if a question should be considered mastered
func (es *EbbinghausService) isQuestionMastered(schedule *models.ReviewSchedule) bool {
	return schedule.CurrentInterval >= 30 && schedule.RepetitionCount >= 5
}

// calculatePriority calculates review priority (1-5, 5 being highest priority)
func (es *EbbinghausService) calculatePriority(schedule *models.ReviewSchedule, result ReviewResult) int {
	basePriority := 3 // Default priority
	
	// Increase priority for failed reviews
	if !result.IsCorrect {
		basePriority = 5
	}
	
	// Adjust based on confidence level
	if result.ConfidenceLevel <= 2 {
		basePriority = int(math.Min(5, float64(basePriority)+1))
	} else if result.ConfidenceLevel >= 4 {
		basePriority = int(math.Max(1, float64(basePriority)-1))
	}
	
	// Adjust based on ease factor (lower ease factor = higher priority)
	if schedule.EaseFactor < 2.0 {
		basePriority = int(math.Min(5, float64(basePriority)+1))
	}
	
	return basePriority
}

// CalculateRetentionProbability calculates memory retention probability
func (es *EbbinghausService) CalculateRetentionProbability(daysSinceLastReview int, easeFactor float64) float64 {
	// Using exponential decay function: R(t) = e^(-t/S)
	// S (stability) is influenced by ease factor
	stability := easeFactor * 2 // Adjust multiplier as needed
	return math.Exp(-float64(daysSinceLastReview) / stability)
}

// GetReviewPriority calculates review urgency score
func (es *EbbinghausService) GetReviewPriority(schedule *models.ReviewSchedule, daysSinceLastReview int) float64 {
	retentionProbability := es.CalculateRetentionProbability(daysSinceLastReview, schedule.EaseFactor)
	urgency := math.Max(0, float64(daysSinceLastReview-schedule.CurrentInterval))
	
	// Combine retention probability and urgency
	return (1-retentionProbability)*10 + urgency
}

// GetOptimalReviewTime suggests the best time to review based on circadian rhythms
func (es *EbbinghausService) GetOptimalReviewTime(userTimeZone string) time.Time {
	now := time.Now()
	
	// Suggest morning review (9 AM) as optimal time
	optimalHour := 9
	
	// Calculate next optimal time
	nextOptimal := time.Date(now.Year(), now.Month(), now.Day(), optimalHour, 0, 0, 0, now.Location())
	
	if now.After(nextOptimal) {
		// If past optimal time today, suggest tomorrow
		nextOptimal = nextOptimal.AddDate(0, 0, 1)
	}
	
	return nextOptimal
}

// CreateInitialSchedule creates the first review schedule for a new question
func (es *EbbinghausService) CreateInitialSchedule(userID, questionID string) *models.ReviewSchedule {
	now := time.Now()
	
	return &models.ReviewSchedule{
		UserID:          userID,
		QuestionID:      questionID,
		CurrentInterval: 1,           // Start with 1 day
		EaseFactor:      2.5,         // Default ease factor
		RepetitionCount: 0,
		NextReviewDate:  now.AddDate(0, 0, 1), // Tomorrow
		Priority:        3,           // Medium priority
		IsCompleted:     false,
		IsMastered:      false,
	}
}

// GetLearningStats calculates learning statistics
func (es *EbbinghausService) GetLearningStats(sessions []models.ReviewSession) map[string]interface{} {
	if len(sessions) == 0 {
		return map[string]interface{}{
			"total_reviews":         0,
			"accuracy_rate":         0,
			"average_response_time": 0,
			"improvement_rate":      0,
			"learning_curve":        []float64{},
			"difficulty_distribution": map[string]int{},
			"streak_analysis":       map[string]interface{}{},
		}
	}
	
	totalReviews := len(sessions)
	correctCount := 0
	totalResponseTime := 0
	difficultyCount := make(map[string]int)
	
	// Calculate recent accuracy (last 10 sessions)
	recentSessions := sessions
	if len(sessions) > 10 {
		recentSessions = sessions[len(sessions)-10:]
	}
	
	recentCorrect := 0
	learningCurve := []float64{}
	currentStreak := 0
	maxStreak := 0
	
	for i, session := range sessions {
		if session.IsCorrect {
			correctCount++
			currentStreak++
		} else {
			if currentStreak > maxStreak {
				maxStreak = currentStreak
			}
			currentStreak = 0
		}
		totalResponseTime += session.ResponseTime
		
		// Calculate moving accuracy for learning curve (window of 5)
		windowStart := int(math.Max(0, float64(i-4)))
		windowEnd := i + 1
		windowSessions := sessions[windowStart:windowEnd]
		windowCorrect := 0
		for _, ws := range windowSessions {
			if ws.IsCorrect {
				windowCorrect++
			}
		}
		windowAccuracy := float64(windowCorrect) / float64(len(windowSessions)) * 100
		learningCurve = append(learningCurve, windowAccuracy)
		
		// Count difficulty levels based on confidence
		if session.ConfidenceLevel <= 2 {
			difficultyCount["hard"]++
		} else if session.ConfidenceLevel >= 4 {
			difficultyCount["easy"]++
		} else {
			difficultyCount["medium"]++
		}
	}
	
	for _, session := range recentSessions {
		if session.IsCorrect {
			recentCorrect++
		}
	}
	
	accuracyRate := float64(correctCount) / float64(totalReviews) * 100
	recentAccuracyRate := float64(recentCorrect) / float64(len(recentSessions)) * 100
	averageResponseTime := totalResponseTime / totalReviews
	improvementRate := recentAccuracyRate - accuracyRate
	
	// Streak analysis
	streakAnalysis := map[string]interface{}{
		"current_streak": currentStreak,
		"max_streak":     int(math.Max(float64(maxStreak), float64(currentStreak))),
		"streak_trend":   es.calculateStreakTrend(sessions),
	}
	
	return map[string]interface{}{
		"total_reviews":            totalReviews,
		"accuracy_rate":            accuracyRate,
		"recent_accuracy_rate":     recentAccuracyRate,
		"average_response_time":    averageResponseTime,
		"improvement_rate":         improvementRate,
		"learning_curve":           learningCurve,
		"difficulty_distribution":  difficultyCount,
		"streak_analysis":          streakAnalysis,
		"mastery_prediction":       es.predictMastery(sessions),
		"optimal_review_frequency": es.calculateOptimalFrequency(sessions),
	}
}

// calculateStreakTrend calculates recent streak performance trend
func (es *EbbinghausService) calculateStreakTrend(sessions []models.ReviewSession) string {
	if len(sessions) < 10 {
		return "insufficient_data"
	}
	
	// Compare last 5 vs previous 5 sessions
	recent := sessions[len(sessions)-5:]
	previous := sessions[len(sessions)-10 : len(sessions)-5]
	
	recentCorrect := 0
	previousCorrect := 0
	
	for _, session := range recent {
		if session.IsCorrect {
			recentCorrect++
		}
	}
	
	for _, session := range previous {
		if session.IsCorrect {
			previousCorrect++
		}
	}
	
	if recentCorrect > previousCorrect {
		return "improving"
	} else if recentCorrect < previousCorrect {
		return "declining"
	}
	return "stable"
}

// predictMastery predicts when question will be mastered
func (es *EbbinghausService) predictMastery(sessions []models.ReviewSession) map[string]interface{} {
	if len(sessions) < 3 {
		return map[string]interface{}{
			"predicted_sessions": -1,
			"confidence":         0,
			"mastery_score":      0,
		}
	}
	
	// Calculate recent accuracy trend
	recentSessions := sessions
	if len(sessions) > 10 {
		recentSessions = sessions[len(sessions)-10:]
	}
	
	correctCount := 0
	totalTime := 0
	
	for _, session := range recentSessions {
		if session.IsCorrect {
			correctCount++
		}
		totalTime += session.ResponseTime
	}
	
	accuracyRate := float64(correctCount) / float64(len(recentSessions))
	avgResponseTime := float64(totalTime) / float64(len(recentSessions))
	
	// Mastery score based on accuracy and response time
	// High accuracy + low response time = higher mastery
	masteryScore := accuracyRate * 0.7
	if avgResponseTime > 0 {
		timeScore := math.Max(0, (10000-avgResponseTime)/10000) // Normalize response time
		masteryScore += timeScore * 0.3
	}
	
	// Predict sessions needed (simplified model)
	var predictedSessions int
	if masteryScore >= 0.85 {
		predictedSessions = 1
	} else if masteryScore >= 0.7 {
		predictedSessions = 2
	} else if masteryScore >= 0.5 {
		predictedSessions = 5
	} else {
		predictedSessions = 10
	}
	
	confidence := math.Min(masteryScore*100, 95) // Max 95% confidence
	
	return map[string]interface{}{
		"predicted_sessions": predictedSessions,
		"confidence":         confidence,
		"mastery_score":      masteryScore,
	}
}

// calculateOptimalFrequency suggests optimal review frequency
func (es *EbbinghausService) calculateOptimalFrequency(sessions []models.ReviewSession) map[string]interface{} {
	if len(sessions) < 5 {
		return map[string]interface{}{
			"recommended_interval": 1,
			"reason":               "insufficient_data",
		}
	}
	
	// Analyze performance patterns
	correctCount := 0
	totalTime := 0
	
	for _, session := range sessions {
		if session.IsCorrect {
			correctCount++
		}
		totalTime += session.ResponseTime
	}
	
	accuracyRate := float64(correctCount) / float64(len(sessions))
	avgResponseTime := float64(totalTime) / float64(len(sessions))
	
	var recommendedInterval int
	var reason string
	
	if accuracyRate >= 0.9 && avgResponseTime < 5000 {
		recommendedInterval = 7 // Weekly
		reason = "high_mastery"
	} else if accuracyRate >= 0.8 {
		recommendedInterval = 3 // Every 3 days
		reason = "good_retention"
	} else if accuracyRate >= 0.6 {
		recommendedInterval = 2 // Every 2 days
		reason = "moderate_retention"
	} else {
		recommendedInterval = 1 // Daily
		reason = "needs_practice"
	}
	
	return map[string]interface{}{
		"recommended_interval": recommendedInterval,
		"reason":               reason,
		"current_accuracy":     accuracyRate * 100,
		"avg_response_time":    avgResponseTime,
	}
}

// GetAdaptiveReviewSchedule creates an adaptive review schedule
func (es *EbbinghausService) GetAdaptiveReviewSchedule(userID string, questionType string) ([]time.Time, error) {
	// This would analyze user's performance patterns and create a personalized schedule
	schedule := []time.Time{}
	now := time.Now()
	
	// Default adaptive schedule based on cognitive load theory
	intervals := []int{1, 2, 4, 8, 15, 30} // Days
	
	for _, interval := range intervals {
		reviewTime := now.AddDate(0, 0, interval)
		// Adjust time to user's optimal learning hours (e.g., 9 AM)
		reviewTime = time.Date(reviewTime.Year(), reviewTime.Month(), reviewTime.Day(), 9, 0, 0, 0, reviewTime.Location())
		schedule = append(schedule, reviewTime)
	}
	
	return schedule, nil
}

// AnalyzeUserLearningPattern analyzes user's learning patterns
func (es *EbbinghausService) AnalyzeUserLearningPattern(sessions []models.ReviewSession) map[string]interface{} {
	if len(sessions) == 0 {
		return map[string]interface{}{"pattern": "no_data"}
	}
	
	// Analyze time-of-day performance
	hourPerformance := make(map[int][]bool)
	for _, session := range sessions {
		hour := session.CreatedAt.Hour()
		hourPerformance[hour] = append(hourPerformance[hour], session.IsCorrect)
	}
	
	bestHour := -1
	bestAccuracy := 0.0
	
	for hour, results := range hourPerformance {
		if len(results) < 2 { // Need at least 2 sessions
			continue
		}
		
		correct := 0
		for _, isCorrect := range results {
			if isCorrect {
				correct++
			}
		}
		
		accuracy := float64(correct) / float64(len(results))
		if accuracy > bestAccuracy {
			bestAccuracy = accuracy
			bestHour = hour
		}
	}
	
	// Analyze day-of-week patterns
	dayPerformance := make(map[time.Weekday][]bool)
	for _, session := range sessions {
		day := session.CreatedAt.Weekday()
		dayPerformance[day] = append(dayPerformance[day], session.IsCorrect)
	}
	
	// Learning velocity (improvement over time)
	velocity := es.calculateLearningVelocity(sessions)
	
	return map[string]interface{}{
		"best_hour":              bestHour,
		"best_hour_accuracy":     bestAccuracy,
		"day_performance":        dayPerformance,
		"learning_velocity":      velocity,
		"consistency_score":      es.calculateConsistencyScore(sessions),
		"recommended_schedule":   es.generatePersonalizedSchedule(bestHour, velocity),
	}
}

// calculateLearningVelocity measures how quickly user is improving
func (es *EbbinghausService) calculateLearningVelocity(sessions []models.ReviewSession) float64 {
	if len(sessions) < 10 {
		return 0
	}
	
	// Split sessions into first half and second half
	mid := len(sessions) / 2
	firstHalf := sessions[:mid]
	secondHalf := sessions[mid:]
	
	firstAccuracy := es.calculateAccuracy(firstHalf)
	secondAccuracy := es.calculateAccuracy(secondHalf)
	
	return secondAccuracy - firstAccuracy
}

// calculateAccuracy helper function
func (es *EbbinghausService) calculateAccuracy(sessions []models.ReviewSession) float64 {
	if len(sessions) == 0 {
		return 0
	}
	
	correct := 0
	for _, session := range sessions {
		if session.IsCorrect {
			correct++
		}
	}
	
	return float64(correct) / float64(len(sessions))
}

// calculateConsistencyScore measures how consistent the user's performance is
func (es *EbbinghausService) calculateConsistencyScore(sessions []models.ReviewSession) float64 {
	if len(sessions) < 5 {
		return 0
	}
	
	accuracies := []float64{}
	windowSize := 5
	
	for i := windowSize - 1; i < len(sessions); i++ {
		window := sessions[i-windowSize+1 : i+1]
		accuracy := es.calculateAccuracy(window)
		accuracies = append(accuracies, accuracy)
	}
	
	// Calculate standard deviation
	mean := 0.0
	for _, acc := range accuracies {
		mean += acc
	}
	mean /= float64(len(accuracies))
	
	variance := 0.0
	for _, acc := range accuracies {
		variance += math.Pow(acc-mean, 2)
	}
	variance /= float64(len(accuracies))
	
	stdDev := math.Sqrt(variance)
	
	// Convert to consistency score (lower standard deviation = higher consistency)
	consistencyScore := math.Max(0, 1-stdDev)
	
	return consistencyScore
}

// generatePersonalizedSchedule creates a personalized review schedule
func (es *EbbinghausService) generatePersonalizedSchedule(bestHour int, velocity float64) []string {
	schedule := []string{}
	
	if bestHour == -1 {
		bestHour = 9 // Default to 9 AM
	}
	
	// Adjust frequency based on learning velocity
	baseIntervals := []int{1, 3, 7, 14, 30} // Default intervals
	
	if velocity > 0.2 { // Fast learner
		baseIntervals = []int{2, 5, 10, 21, 42} // Longer intervals
	} else if velocity < -0.1 { // Struggling learner
		baseIntervals = []int{1, 2, 4, 7, 14} // Shorter intervals
	}
	
	for _, interval := range baseIntervals {
		schedule = append(schedule, fmt.Sprintf("%d days at %d:00", interval, bestHour))
	}
	
	return schedule
}