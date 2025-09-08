package services

import (
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
			"total_reviews":    0,
			"accuracy_rate":    0,
			"average_response_time": 0,
			"improvement_rate": 0,
		}
	}
	
	totalReviews := len(sessions)
	correctCount := 0
	totalResponseTime := 0
	
	// Calculate recent accuracy (last 10 sessions)
	recentSessions := sessions
	if len(sessions) > 10 {
		recentSessions = sessions[len(sessions)-10:]
	}
	
	recentCorrect := 0
	for _, session := range sessions {
		if session.IsCorrect {
			correctCount++
		}
		totalResponseTime += session.ResponseTime
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
	
	return map[string]interface{}{
		"total_reviews":         totalReviews,
		"accuracy_rate":         accuracyRate,
		"recent_accuracy_rate":  recentAccuracyRate,
		"average_response_time": averageResponseTime,
		"improvement_rate":      improvementRate,
	}
}