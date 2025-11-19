package controllers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"
	"pte-memory-backend/services"
	"pte-memory-backend/websocket"

	"github.com/gin-gonic/gin"
)

type AnalyticsController struct {
	analyticsService *services.AnalyticsService
	wsHub           *websocket.Hub
}

func NewAnalyticsController(wsHub *websocket.Hub) *AnalyticsController {
	return &AnalyticsController{
		analyticsService: services.NewAnalyticsService(database.DB),
		wsHub:           wsHub,
	}
}

// GetDashboardStats 获取仪表板统计数据
func (ac *AnalyticsController) GetDashboardStats(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取统计数据失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// GetLearningTrends 获取学习趋势数据
func (ac *AnalyticsController) GetLearningTrends(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	// 获取时间范围参数
	period := c.DefaultQuery("period", "month") // week, month, quarter, year
	
	var trends interface{}
	var err error

	switch period {
	case "week":
		trends, err = ac.getWeeklyTrends(userID)
	case "month":
		trends, err = ac.getMonthlyTrends(userID)
	case "quarter":
		trends, err = ac.getQuarterlyTrends(userID)
	case "year":
		trends, err = ac.getYearlyTrends(userID)
	default:
		trends, err = ac.getMonthlyTrends(userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取趋势数据失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"period": period,
		"trends": trends,
	})
}

// GetPerformanceComparison 获取表现对比数据
func (ac *AnalyticsController) GetPerformanceComparison(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	comparisonType := c.DefaultQuery("type", "type") // type, difficulty, time
	
	comparison, err := ac.getPerformanceComparison(userID, comparisonType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取对比数据失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"comparison_type": comparisonType,
		"data":           comparison,
	})
}

// GetStudyPattern 获取学习模式分析
func (ac *AnalyticsController) GetStudyPattern(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	pattern, err := ac.analyzeStudyPattern(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取学习模式失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pattern": pattern,
	})
}

// GetAchievementProgress 获取成就进度
func (ac *AnalyticsController) GetAchievementProgress(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	achievements, err := ac.getAchievementProgress(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取成就数据失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"achievements": achievements,
	})
}

// GetPersonalizedInsights 获取个性化洞察
func (ac *AnalyticsController) GetPersonalizedInsights(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	insights, err := ac.generatePersonalizedInsights(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取个性化洞察失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"insights": insights,
	})
}

// GetReviewHeatmap 获取复习热力图数据
func (ac *AnalyticsController) GetReviewHeatmap(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	// 获取时间范围参数，默认过去一年
	days := c.DefaultQuery("days", "365")
	
	heatmapData, err := ac.getReviewHeatmapData(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "获取热力图数据失败",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"heatmap_data": heatmapData,
		"period_days":  days,
	})
}

// ExportAnalyticsData 导出分析数据
func (ac *AnalyticsController) ExportAnalyticsData(c *gin.Context) {
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未找到"})
		return
	}

	format := c.DefaultQuery("format", "json") // json, csv, excel
	
	data, err := ac.exportData(userID, format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "导出数据失败",
			"message": err.Error(),
		})
		return
	}

	// 设置响应头
	filename := time.Now().Format("20060102_150405") + "_analytics." + format
	c.Header("Content-Disposition", "attachment; filename="+filename)
	
	switch format {
	case "csv":
		c.Header("Content-Type", "text/csv")
	case "excel":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	default:
		c.Header("Content-Type", "application/json")
	}

	c.Data(http.StatusOK, c.GetHeader("Content-Type"), data)
}

// 内部辅助方法

func (ac *AnalyticsController) getWeeklyTrends(userID string) (interface{}, error) {
	now := time.Now()

	var accuracyTrend []float64
	var studyTimeTrend []int
	var questionsTrend []int

	// 获取最近7天的真实数据
	for i := 6; i >= 0; i-- {
		dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -i)
		dayEnd := dayStart.Add(24 * time.Hour)

		// 查询当天的复习会话
		var sessions []struct {
			IsCorrect    bool
			ResponseTime int
		}
		database.DB.Model(&models.ReviewSession{}).
			Select("is_correct, response_time").
			Where("user_id = ? AND reviewed_at >= ? AND reviewed_at < ?", userID, dayStart, dayEnd).
			Find(&sessions)

		// 计算准确率
		correct := 0
		totalTime := 0
		for _, s := range sessions {
			if s.IsCorrect {
				correct++
			}
			totalTime += s.ResponseTime
		}

		accuracy := 0.0
		if len(sessions) > 0 {
			accuracy = float64(correct) / float64(len(sessions)) * 100
		}

		studyMinutes := totalTime / (1000 * 60) // 转换为分钟
		if studyMinutes == 0 && len(sessions) > 0 {
			studyMinutes = len(sessions) // 至少按题目数计算
		}

		accuracyTrend = append(accuracyTrend, math.Round(accuracy*100)/100)
		studyTimeTrend = append(studyTimeTrend, studyMinutes)
		questionsTrend = append(questionsTrend, len(sessions))
	}

	return map[string]interface{}{
		"accuracy_trend":   accuracyTrend,
		"study_time_trend": studyTimeTrend,
		"questions_trend":  questionsTrend,
	}, nil
}

func (ac *AnalyticsController) getMonthlyTrends(userID string) (interface{}, error) {
	now := time.Now()
	var weeklySummary []map[string]interface{}

	// 获取最近4周的数据
	for week := 3; week >= 0; week-- {
		weekStart := now.AddDate(0, 0, -7*(week+1))
		weekEnd := now.AddDate(0, 0, -7*week)

		var sessions []struct {
			IsCorrect    bool
			ResponseTime int
		}
		database.DB.Model(&models.ReviewSession{}).
			Select("is_correct, response_time").
			Where("user_id = ? AND reviewed_at >= ? AND reviewed_at < ?", userID, weekStart, weekEnd).
			Find(&sessions)

		// 统计
		correct := 0
		totalTime := 0
		for _, s := range sessions {
			if s.IsCorrect {
				correct++
			}
			totalTime += s.ResponseTime
		}

		accuracy := 0.0
		if len(sessions) > 0 {
			accuracy = float64(correct) / float64(len(sessions)) * 100
		}

		studyMinutes := totalTime / (1000 * 60)

		weeklySummary = append(weeklySummary, map[string]interface{}{
			"week":          4 - week,
			"accuracy":      math.Round(accuracy*10) / 10,
			"study_minutes": studyMinutes,
			"questions":     len(sessions),
		})
	}

	// 计算改进率（第一周与最后一周对比）
	improvementRate := 0.0
	if len(weeklySummary) >= 2 {
		firstAccuracy := weeklySummary[0]["accuracy"].(float64)
		lastAccuracy := weeklySummary[len(weeklySummary)-1]["accuracy"].(float64)
		if firstAccuracy > 0 {
			improvementRate = ((lastAccuracy - firstAccuracy) / firstAccuracy) * 100
		}
	}

	// 一致性评分（有学习的周数 / 总周数）
	consistencyScore := 0.0
	studyWeeks := 0
	for _, week := range weeklySummary {
		if week["questions"].(int) > 0 {
			studyWeeks++
		}
	}
	if len(weeklySummary) > 0 {
		consistencyScore = float64(studyWeeks) / float64(len(weeklySummary))
	}

	return map[string]interface{}{
		"weekly_summary":    weeklySummary,
		"improvement_rate":  math.Round(improvementRate*100) / 100,
		"consistency_score": math.Round(consistencyScore*100) / 100,
	}, nil
}

func (ac *AnalyticsController) getQuarterlyTrends(userID string) (interface{}, error) {
	// 使用 AnalyticsService 获取月度进度数据
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	// 按月聚合最近30天的数据（简化为最近3个月）
	now := time.Now()
	var monthlySummary []map[string]interface{}

	for monthOffset := 2; monthOffset >= 0; monthOffset-- {
		monthStart := now.AddDate(0, -monthOffset-1, 0)
		monthEnd := now.AddDate(0, -monthOffset, 0)

		var sessions []struct {
			IsCorrect    bool
			ResponseTime int
		}
		database.DB.Model(&models.ReviewSession{}).
			Select("is_correct, response_time").
			Where("user_id = ? AND reviewed_at >= ? AND reviewed_at < ?", userID, monthStart, monthEnd).
			Find(&sessions)

		correct := 0
		totalTime := 0
		for _, s := range sessions {
			if s.IsCorrect {
				correct++
			}
			totalTime += s.ResponseTime
		}

		avgAccuracy := 0.0
		if len(sessions) > 0 {
			avgAccuracy = float64(correct) / float64(len(sessions)) * 100
		}

		studyHours := totalTime / (1000 * 60 * 60)

		monthlySummary = append(monthlySummary, map[string]interface{}{
			"month":            monthStart.Format("January"),
			"avg_accuracy":     math.Round(avgAccuracy*10) / 10,
			"total_study_hours": studyHours,
			"total_questions":  len(sessions),
		})
	}

	// 计算季度改进（首月与末月对比）
	quarterImprovement := 0.0
	if len(monthlySummary) >= 2 {
		firstAcc := monthlySummary[0]["avg_accuracy"].(float64)
		lastAcc := monthlySummary[len(monthlySummary)-1]["avg_accuracy"].(float64)
		if firstAcc > 0 {
			quarterImprovement = ((lastAcc - firstAcc) / firstAcc) * 100
		}
	}

	return map[string]interface{}{
		"monthly_summary":     monthlySummary,
		"quarter_improvement": math.Round(quarterImprovement*100) / 100,
		"learning_velocity":   stats.LearningInsights.LearningVelocity,
	}, nil
}

func (ac *AnalyticsController) getYearlyTrends(userID string) (interface{}, error) {
	// 获取年度统计数据（使用数据库查询）
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	// 从30天数据推算年度数据
	totalMastered := stats.MasteredQuestions
	yearImprovement := stats.LearningInsights.LearningVelocity * 12 // 简化计算

	return map[string]interface{}{
		"total_mastered":       totalMastered,
		"year_improvement":     math.Round(yearImprovement*100) / 100,
		"learning_consistency": stats.LearningInsights.ConsistencyScore,
		"avg_accuracy":         stats.AvgAccuracy,
	}, nil
}

func (ac *AnalyticsController) getPerformanceComparison(userID string, comparisonType string) (interface{}, error) {
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	switch comparisonType {
	case "type":
		// 使用真实的题型表现数据
		typeComparison := make(map[string]interface{})
		for _, perf := range stats.TypePerformance {
			typeComparison[perf.Type] = map[string]interface{}{
				"accuracy":        perf.Accuracy,
				"avg_time":        perf.AvgTime,
				"total_questions": perf.Total,
				"reviewed":        perf.Reviewed,
			}
		}
		return typeComparison, nil

	case "difficulty":
		// 使用真实的难度统计数据
		difficultyComparison := make(map[string]interface{})
		for _, diff := range stats.DifficultyStats {
			level := "easy"
			if diff.Level == 3 {
				level = "medium"
			} else if diff.Level >= 4 {
				level = "hard"
			}

			masteryRate := 0.0
			if diff.Total > 0 {
				masteryRate = float64(diff.Correct) / float64(diff.Total)
			}

			difficultyComparison[level] = map[string]interface{}{
				"accuracy":     diff.Accuracy,
				"avg_time":     diff.AvgTime,
				"mastery_rate": math.Round(masteryRate*100) / 100,
			}
		}
		return difficultyComparison, nil

	default:
		return map[string]interface{}{}, nil
	}
}

func (ac *AnalyticsController) analyzeStudyPattern(userID string) (interface{}, error) {
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	return map[string]interface{}{
		"optimal_study_time":       stats.LearningInsights.OptimalStudyTime,
		"preferred_session_length": stats.StudyTime.AvgDailyMinutes,
		"peak_performance_day":     stats.StudyTime.BestDay,
		"consistency_score":        stats.LearningInsights.ConsistencyScore,
		"weekday_pattern":          stats.StudyTime.WeekdayPattern,
		"hourly_pattern":           stats.StudyTime.HourlyPattern,
	}, nil
}

func (ac *AnalyticsController) getAchievementProgress(userID string) (interface{}, error) {
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	// 统计成就状态
	totalAchievements := len(stats.Achievements)
	unlocked := 0
	inProgress := 0

	for _, achievement := range stats.Achievements {
		if achievement.Completed {
			unlocked++
		} else if achievement.Progress > 0 {
			inProgress++
		}
	}
	locked := totalAchievements - unlocked - inProgress

	return map[string]interface{}{
		"total_achievements": totalAchievements,
		"unlocked":           unlocked,
		"in_progress":        inProgress,
		"locked":             locked,
		"achievements":       stats.Achievements,
	}, nil
}

func (ac *AnalyticsController) generatePersonalizedInsights(userID string) (interface{}, error) {
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return map[string]interface{}{}, err
	}

	return map[string]interface{}{
		"strengths":             stats.LearningInsights.StrengthAreas,
		"areas_for_improvement": stats.LearningInsights.WeakAreas,
		"learning_recommendations": stats.Recommendations,
		"optimal_study_time":    stats.LearningInsights.OptimalStudyTime,
		"suggested_frequency":   stats.LearningInsights.SuggestedFrequency,
		"consistency_score":     stats.LearningInsights.ConsistencyScore,
		"learning_velocity":     stats.LearningInsights.LearningVelocity,
		"motivation_tips":       stats.LearningInsights.MotivationFactors,
	}, nil
}

func (ac *AnalyticsController) getReviewHeatmapData(userID string, daysStr string) (interface{}, error) {
	// 解析天数参数
	days := 365
	if d, err := time.ParseDuration(daysStr + "h"); err == nil {
		days = int(d.Hours() / 24)
	}

	// 获取指定时间范围内的复习数据
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -days)

	type HeatmapData struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
		Level int    `json:"level"` // 0-4 intensity level
	}

	var heatmapEntries []HeatmapData
	
	// 查询数据库获取真实复习数据
	query := `
		SELECT DATE(reviewed_at) as review_date, COUNT(*) as review_count
		FROM review_sessions 
		WHERE user_id = ? AND reviewed_at BETWEEN ? AND ?
		GROUP BY DATE(reviewed_at)
		ORDER BY review_date
	`

	rows, err := database.DB.Raw(query, userID, startDate, endDate).Rows()
	if err != nil {
		return nil, fmt.Errorf("查询复习数据失败: %v", err)
	}
	defer rows.Close()

	reviewCounts := make(map[string]int)
	maxCount := 0

	for rows.Next() {
		var reviewDate string
		var reviewCount int
		
		if err := rows.Scan(&reviewDate, &reviewCount); err != nil {
			continue
		}

		reviewCounts[reviewDate] = reviewCount
		if reviewCount > maxCount {
			maxCount = reviewCount
		}
	}

	// 生成完整的日期范围数据
	for d := startDate; d.Before(endDate); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		count := reviewCounts[dateStr]
		
		// 计算强度等级 (0-4)
		level := 0
		if count > 0 && maxCount > 0 {
			level = int((float64(count) / float64(maxCount)) * 4)
			if level == 0 {
				level = 1 // 至少显示为1级
			}
		}

		heatmapEntries = append(heatmapEntries, HeatmapData{
			Date:  dateStr,
			Count: count,
			Level: level,
		})
	}

	return map[string]interface{}{
		"data":       heatmapEntries,
		"start_date": startDate.Format("2006-01-02"),
		"end_date":   endDate.Format("2006-01-02"),
		"max_count":  maxCount,
		"total_days": len(heatmapEntries),
	}, nil
}


func (ac *AnalyticsController) exportData(userID string, format string) ([]byte, error) {
	// 获取完整统计数据
	stats, err := ac.analyticsService.GetDashboardStats(userID)
	if err != nil {
		return nil, err
	}

	switch format {
	case "csv":
		// 简化的CSV导出实现
		csvData := "Date,Questions,Correct,Accuracy,Study_Minutes\n"
		for _, day := range stats.MonthlyProgress {
			csvData += fmt.Sprintf("%s,%d,%d,%.1f,%d\n", 
				day.Date, day.Questions, day.Correct, day.Accuracy, day.StudyMinutes)
		}
		return []byte(csvData), nil
		
	default:
		// JSON导出
		return json.Marshal(stats)
	}
}