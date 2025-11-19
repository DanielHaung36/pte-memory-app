package services

import (
	"fmt"
	"math"
	"sort"
	"time"

	"gorm.io/gorm"
	"pte-memory-backend/models"
)

// AnalyticsService 提供高级数据分析功能
type AnalyticsService struct {
	db *gorm.DB
}

// NewAnalyticsService 创建新的分析服务
func NewAnalyticsService(db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// DashboardStats 仪表板统计数据
type DashboardStats struct {
	User             *models.User          `json:"user"`
	TotalQuestions   int                   `json:"total_questions"`
	DueQuestions     int                   `json:"due_questions"`
	OverdueQuestions int                   `json:"overdue_questions"`
	MasteredQuestions int                  `json:"mastered_questions"`
	WrongQuestions   int                   `json:"wrong_questions"`
	UnresolvedWrong  int                   `json:"unresolved_wrong"`
	TodayReviewed    int                   `json:"today_reviewed"`
	WeeklyReviewed   int                   `json:"weekly_reviewed"`
	MonthlyReviewed  int                   `json:"monthly_reviewed"`
	CurrentStreak    int                   `json:"current_streak"`
	BestStreak       int                   `json:"best_streak"`
	AvgAccuracy      float64               `json:"avg_accuracy"`
	RecentAccuracy   float64               `json:"recent_accuracy"`
	StudyTime        StudyTimeStats        `json:"study_time"`
	TypePerformance  []TypePerformance     `json:"type_performance"`
	DifficultyStats  []DifficultyStats     `json:"difficulty_stats"`
	WeeklyProgress   []DailyProgress       `json:"weekly_progress"`
	MonthlyProgress  []DailyProgress       `json:"monthly_progress"`
	LearningInsights LearningInsights      `json:"learning_insights"`
	Achievements     []Achievement         `json:"achievements"`
	Recommendations  []Recommendation      `json:"recommendations"`
}

// StudyTimeStats 学习时间统计
type StudyTimeStats struct {
	TodayMinutes    int                    `json:"today_minutes"`
	WeekMinutes     int                    `json:"week_minutes"`
	MonthMinutes    int                    `json:"month_minutes"`
	TotalMinutes    int                    `json:"total_minutes"`
	AvgDailyMinutes float64                `json:"avg_daily_minutes"`
	BestDay         string                 `json:"best_day"`
	HourlyPattern   map[string]int         `json:"hourly_pattern"`
	WeekdayPattern  map[string]StudyStats  `json:"weekday_pattern"`
}

// StudyStats 学习统计详情
type StudyStats struct {
	Minutes   int     `json:"minutes"`
	Questions int     `json:"questions"`
	Accuracy  float64 `json:"accuracy"`
}

// TypePerformance 题型表现
type TypePerformance struct {
	Type         string  `json:"type"`
	TypeLabel    string  `json:"type_label"`
	Total        int     `json:"total"`
	Reviewed     int     `json:"reviewed"`
	Correct      int     `json:"correct"`
	Wrong        int     `json:"wrong"`
	Accuracy     float64 `json:"accuracy"`
	AvgTime      int     `json:"avg_time"`
	Mastered     int     `json:"mastered"`
	Improvement  float64 `json:"improvement"`
	Trend        string  `json:"trend"` // improving, declining, stable
}

// DifficultyStats 难度统计
type DifficultyStats struct {
	Level     int     `json:"level"`
	LevelName string  `json:"level_name"`
	Total     int     `json:"total"`
	Correct   int     `json:"correct"`
	Accuracy  float64 `json:"accuracy"`
	AvgTime   int     `json:"avg_time"`
}

// DailyProgress 每日进度
type DailyProgress struct {
	Date         string  `json:"date"`
	Questions    int     `json:"questions"`
	Correct      int     `json:"correct"`
	Wrong        int     `json:"wrong"`
	Accuracy     float64 `json:"accuracy"`
	StudyMinutes int     `json:"study_minutes"`
	NewLearned   int     `json:"new_learned"`
}

// LearningInsights 学习洞察
type LearningInsights struct {
	LearningVelocity   float64                `json:"learning_velocity"`
	ConsistencyScore   float64                `json:"consistency_score"`
	StrengthAreas      []string               `json:"strength_areas"`
	WeakAreas          []string               `json:"weak_areas"`
	OptimalStudyTime   string                 `json:"optimal_study_time"`
	SuggestedFrequency string                 `json:"suggested_frequency"`
	PredictedMastery   map[string]interface{} `json:"predicted_mastery"`
	MotivationFactors  []string               `json:"motivation_factors"`
}

// Achievement 成就
type Achievement struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Category    string    `json:"category"`
	Progress    int       `json:"progress"`
	Target      int       `json:"target"`
	Completed   bool      `json:"completed"`
	UnlockedAt  *time.Time `json:"unlocked_at,omitempty"`
	XPReward    int       `json:"xp_reward"`
}

// Recommendation 学习建议
type Recommendation struct {
	Type        string      `json:"type"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Priority    int         `json:"priority"` // 1-5, 5最高
	Action      string      `json:"action"`
	Data        interface{} `json:"data,omitempty"`
}

// GetDashboardStats 获取完整的仪表板统计数据
func (as *AnalyticsService) GetDashboardStats(userID string) (*DashboardStats, error) {
	var user models.User
	if err := as.db.Preload("UserStats").First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	stats := &DashboardStats{
		User: &user,
	}

	// 并行获取各种统计数据
	errChan := make(chan error, 10)
	
	go func() {
		errChan <- as.getQuestionStats(userID, stats)
	}()
	
	go func() {
		errChan <- as.getReviewStats(userID, stats)
	}()
	
	go func() {
		errChan <- as.getStreakStats(userID, stats)
	}()
	
	go func() {
		errChan <- as.getStudyTimeStats(userID, stats)
	}()
	
	go func() {
		errChan <- as.getTypePerformance(userID, stats)
	}()
	
	go func() {
		errChan <- as.getDifficultyStats(userID, stats)
	}()
	
	go func() {
		errChan <- as.getProgressData(userID, stats)
	}()
	
	go func() {
		errChan <- as.getLearningInsights(userID, stats)
	}()
	
	go func() {
		errChan <- as.getAchievements(userID, stats)
	}()
	
	go func() {
		errChan <- as.getRecommendations(userID, stats)
	}()

	// 等待所有协程完成
	for i := 0; i < 10; i++ {
		if err := <-errChan; err != nil {
			return nil, err
		}
	}

	return stats, nil
}

// getQuestionStats 获取题目统计
func (as *AnalyticsService) getQuestionStats(userID string, stats *DashboardStats) error {
	// 总题目数
	var totalQuestions int64
	as.db.Model(&models.Question{}).Where("user_id = ?", userID).Count(&totalQuestions)
	stats.TotalQuestions = int(totalQuestions)

	// 待复习题目
	var dueCount int64
	as.db.Model(&models.ReviewSchedule{}).
		Where("user_id = ? AND next_review_date <= ? AND is_completed = false", 
			userID, time.Now()).Count(&dueCount)
	stats.DueQuestions = int(dueCount)

	// 逾期题目
	var overdueCount int64
	as.db.Model(&models.ReviewSchedule{}).
		Where("user_id = ? AND next_review_date < ? AND is_completed = false", 
			userID, time.Now().AddDate(0, 0, -1)).Count(&overdueCount)
	stats.OverdueQuestions = int(overdueCount)

	// 已掌握题目
	var masteredCount int64
	as.db.Model(&models.ReviewSchedule{}).
		Where("user_id = ? AND is_mastered = true", userID).Count(&masteredCount)
	stats.MasteredQuestions = int(masteredCount)

	// 错题统计
	var wrongCount, unresolvedCount int64
	as.db.Model(&models.WrongQuestion{}).Where("user_id = ?", userID).Count(&wrongCount)
	as.db.Model(&models.WrongQuestion{}).Where("user_id = ? AND is_resolved = false", userID).Count(&unresolvedCount)
	stats.WrongQuestions = int(wrongCount)
	stats.UnresolvedWrong = int(unresolvedCount)

	return nil
}

// getReviewStats 获取复习统计
func (as *AnalyticsService) getReviewStats(userID string, stats *DashboardStats) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekAgo := today.AddDate(0, 0, -7)
	monthAgo := today.AddDate(0, -1, 0)

	// 今日复习
	var todayCount int64
	as.db.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ?", userID, today).Count(&todayCount)
	stats.TodayReviewed = int(todayCount)

	// 本周复习
	var weekCount int64
	as.db.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ?", userID, weekAgo).Count(&weekCount)
	stats.WeeklyReviewed = int(weekCount)

	// 本月复习
	var monthCount int64
	as.db.Model(&models.ReviewSession{}).
		Where("user_id = ? AND created_at >= ?", userID, monthAgo).Count(&monthCount)
	stats.MonthlyReviewed = int(monthCount)

	// 计算平均准确率
	var result struct {
		TotalSessions int
		CorrectCount  int
	}
	
	as.db.Model(&models.ReviewSession{}).
		Select("COUNT(*) as total_sessions, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count").
		Where("user_id = ?", userID).
		Scan(&result)
	
	if result.TotalSessions > 0 {
		stats.AvgAccuracy = float64(result.CorrectCount) / float64(result.TotalSessions) * 100
	}

	// 最近准确率（最近20次）
	var recentSessions []models.ReviewSession
	as.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(20).
		Find(&recentSessions)

	if len(recentSessions) > 0 {
		correctCount := 0
		for _, session := range recentSessions {
			if session.IsCorrect {
				correctCount++
			}
		}
		stats.RecentAccuracy = float64(correctCount) / float64(len(recentSessions)) * 100
	}

	return nil
}

// getStreakStats 获取连击统计
func (as *AnalyticsService) getStreakStats(userID string, stats *DashboardStats) error {
	// 计算当前连击
	var sessions []models.ReviewSession
	as.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(100).
		Find(&sessions)

	currentStreak := 0
	maxStreak := 0
	tempStreak := 0

	for i, session := range sessions {
		if session.IsCorrect {
			if i == 0 { // 最新的session
				currentStreak++
			}
			tempStreak++
		} else {
			if i == 0 {
				currentStreak = 0
			}
			if tempStreak > maxStreak {
				maxStreak = tempStreak
			}
			tempStreak = 0
		}
	}

	if tempStreak > maxStreak {
		maxStreak = tempStreak
	}

	stats.CurrentStreak = currentStreak
	stats.BestStreak = maxStreak

	return nil
}

// getStudyTimeStats 获取学习时间统计
func (as *AnalyticsService) getStudyTimeStats(userID string, stats *DashboardStats) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekAgo := today.AddDate(0, 0, -7)
	monthAgo := today.AddDate(0, -1, 0)

	studyStats := StudyTimeStats{
		HourlyPattern:  make(map[string]int),
		WeekdayPattern: make(map[string]StudyStats),
	}

	// 获取所有复习会话用于时间分析
	var sessions []models.ReviewSession
	as.db.Where("user_id = ?", userID).Find(&sessions)

	totalMinutes := 0
	todayMinutes := 0
	weekMinutes := 0
	monthMinutes := 0

	hourlyCount := make(map[int]int)
	weekdayStats := make(map[time.Weekday]StudyStats)

	for _, session := range sessions {
		minutes := session.ResponseTime / (1000 * 60) // 转换为分钟
		if minutes == 0 {
			minutes = 1 // 最少1分钟
		}

		totalMinutes += minutes

		// 今日时间
		if session.CreatedAt.After(today) {
			todayMinutes += minutes
		}

		// 本周时间
		if session.CreatedAt.After(weekAgo) {
			weekMinutes += minutes
		}

		// 本月时间
		if session.CreatedAt.After(monthAgo) {
			monthMinutes += minutes
		}

		// 小时模式
		hour := session.CreatedAt.Hour()
		hourlyCount[hour]++

		// 星期模式
		weekday := session.CreatedAt.Weekday()
		if stats, exists := weekdayStats[weekday]; exists {
			stats.Minutes += minutes
			stats.Questions++
			if session.IsCorrect {
				stats.Accuracy = (stats.Accuracy*float64(stats.Questions-1) + 100) / float64(stats.Questions)
			} else {
				stats.Accuracy = (stats.Accuracy * float64(stats.Questions-1)) / float64(stats.Questions)
			}
			weekdayStats[weekday] = stats
		} else {
			accuracy := 0.0
			if session.IsCorrect {
				accuracy = 100.0
			}
			weekdayStats[weekday] = StudyStats{
				Minutes:   minutes,
				Questions: 1,
				Accuracy:  accuracy,
			}
		}
	}

	studyStats.TodayMinutes = todayMinutes
	studyStats.WeekMinutes = weekMinutes
	studyStats.MonthMinutes = monthMinutes
	studyStats.TotalMinutes = totalMinutes

	if len(sessions) > 0 {
		studyStats.AvgDailyMinutes = float64(totalMinutes) / math.Max(1, float64(len(sessions))/7)
	}

	// 转换小时模式
	for hour, count := range hourlyCount {
		studyStats.HourlyPattern[fmt.Sprintf("%02d:00", hour)] = count
	}

	// 转换星期模式
	weekdays := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
	for day, stat := range weekdayStats {
		studyStats.WeekdayPattern[weekdays[int(day)]] = stat
	}

	// 找出最佳学习日
	bestDay := "Monday"
	bestMinutes := 0
	for day, stat := range studyStats.WeekdayPattern {
		if stat.Minutes > bestMinutes {
			bestMinutes = stat.Minutes
			bestDay = day
		}
	}
	studyStats.BestDay = bestDay

	stats.StudyTime = studyStats
	return nil
}

// getTypePerformance 获取题型表现
func (as *AnalyticsService) getTypePerformance(userID string, stats *DashboardStats) error {
	questionTypes := []struct {
		Type  string
		Label string
	}{
		{"speaking", "口语"},
		{"writing", "写作"},
		{"reading", "阅读"},
		{"listening", "听力"},
	}

	var performance []TypePerformance

	for _, qType := range questionTypes {
		var total, reviewed, correct, wrong, mastered int64
		var avgTime float64

		// 总题目数
		as.db.Model(&models.Question{}).
			Where("user_id = ? AND question_type = ?", userID, qType.Type).
			Count(&total)

		// 复习统计
		as.db.Model(&models.ReviewSession{}).
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.question_type = ?", userID, qType.Type).
			Count(&reviewed)

		as.db.Model(&models.ReviewSession{}).
			Select("COUNT(CASE WHEN is_correct THEN 1 END) as correct, COUNT(CASE WHEN NOT is_correct THEN 1 END) as wrong, AVG(response_time) as avg_time").
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.question_type = ?", userID, qType.Type).
			Scan(&struct {
				Correct int64
				Wrong   int64
				AvgTime float64
			}{correct, wrong, avgTime})

		// 已掌握数
		as.db.Model(&models.ReviewSchedule{}).
			Joins("JOIN questions ON questions.id = review_schedules.question_id").
			Where("review_schedules.user_id = ? AND questions.question_type = ? AND review_schedules.is_mastered = true", userID, qType.Type).
			Count(&mastered)

		accuracy := 0.0
		if reviewed > 0 {
			accuracy = float64(correct) / float64(reviewed) * 100
		}

		// 计算趋势（简化版）
		trend := "stable"
		if accuracy > 80 {
			trend = "improving"
		} else if accuracy < 50 {
			trend = "declining"
		}

		// 计算改进度 - 比较最近30天与之前30天的准确率
		improvement := as.calculateImprovement(userID, qType.Type)

		performance = append(performance, TypePerformance{
			Type:        qType.Type,
			TypeLabel:   qType.Label,
			Total:       int(total),
			Reviewed:    int(reviewed),
			Correct:     int(correct),
			Wrong:       int(wrong),
			Accuracy:    accuracy,
			AvgTime:     int(avgTime),
			Mastered:    int(mastered),
			Improvement: improvement,
			Trend:       trend,
		})
	}

	stats.TypePerformance = performance
	return nil
}

// getDifficultyStats 获取难度统计
func (as *AnalyticsService) getDifficultyStats(userID string, stats *DashboardStats) error {
	difficultyLevels := []struct {
		Level int
		Name  string
	}{
		{1, "初级"},
		{2, "简单"},
		{3, "中等"},
		{4, "困难"},
		{5, "极难"},
	}

	var diffStats []DifficultyStats

	for _, level := range difficultyLevels {
		var total, correct int64
		var avgTime float64

		// 总题目数
		as.db.Model(&models.Question{}).
			Where("user_id = ? AND difficulty_level = ?", userID, level.Level).
			Count(&total)

		// 正确率和平均时间
		as.db.Model(&models.ReviewSession{}).
			Select("COUNT(CASE WHEN is_correct THEN 1 END) as correct, AVG(response_time) as avg_time").
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.difficulty_level = ?", userID, level.Level).
			Scan(&struct {
				Correct int64
				AvgTime float64
			}{correct, avgTime})

		var reviewed int64
		as.db.Model(&models.ReviewSession{}).
			Joins("JOIN questions ON questions.id = review_sessions.question_id").
			Where("review_sessions.user_id = ? AND questions.difficulty_level = ?", userID, level.Level).
			Count(&reviewed)

		accuracy := 0.0
		if reviewed > 0 {
			accuracy = float64(correct) / float64(reviewed) * 100
		}

		diffStats = append(diffStats, DifficultyStats{
			Level:     level.Level,
			LevelName: level.Name,
			Total:     int(total),
			Correct:   int(correct),
			Accuracy:  accuracy,
			AvgTime:   int(avgTime),
		})
	}

	stats.DifficultyStats = diffStats
	return nil
}

// getProgressData 获取进度数据
func (as *AnalyticsService) getProgressData(userID string, stats *DashboardStats) error {
	now := time.Now()
	
	// 获取最近30天的数据
	var weeklyProgress, monthlyProgress []DailyProgress
	
	for i := 29; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		var sessions []models.ReviewSession
		as.db.Where("user_id = ? AND created_at >= ? AND created_at < ?", 
			userID, dayStart, dayEnd).Find(&sessions)

		questions := len(sessions)
		correct := 0
		studyMinutes := 0

		for _, session := range sessions {
			if session.IsCorrect {
				correct++
			}
			studyMinutes += session.ResponseTime / (1000 * 60)
		}

		accuracy := 0.0
		if questions > 0 {
			accuracy = float64(correct) / float64(questions) * 100
		}

		// 计算当天新学习的题目数量
		newLearned := as.calculateNewLearnedQuestions(userID, dayStart, dayEnd)

		progress := DailyProgress{
			Date:         date.Format("2006-01-02"),
			Questions:    questions,
			Correct:      correct,
			Wrong:        questions - correct,
			Accuracy:     accuracy,
			StudyMinutes: studyMinutes,
			NewLearned:   newLearned,
		}

		monthlyProgress = append(monthlyProgress, progress)

		// 最近7天为周进度
		if i < 7 {
			weeklyProgress = append(weeklyProgress, progress)
		}
	}

	stats.WeeklyProgress = weeklyProgress
	stats.MonthlyProgress = monthlyProgress
	return nil
}

// getLearningInsights 获取学习洞察
func (as *AnalyticsService) getLearningInsights(userID string, stats *DashboardStats) error {
	insights := LearningInsights{
		StrengthAreas:     []string{},
		WeakAreas:         []string{},
		OptimalStudyTime:  "09:00",
		SuggestedFrequency: "每日",
		MotivationFactors: []string{},
	}

	// 分析强项和弱项
	for _, perf := range stats.TypePerformance {
		if perf.Accuracy >= 80 {
			insights.StrengthAreas = append(insights.StrengthAreas, perf.TypeLabel)
		} else if perf.Accuracy < 60 {
			insights.WeakAreas = append(insights.WeakAreas, perf.TypeLabel)
		}
	}

	// 学习速度（简化计算）
	if stats.RecentAccuracy > stats.AvgAccuracy {
		insights.LearningVelocity = (stats.RecentAccuracy - stats.AvgAccuracy) / 100
	} else {
		insights.LearningVelocity = 0
	}

	// 一致性评分（基于每日学习情况）
	if len(stats.WeeklyProgress) > 0 {
		studyDays := 0
		for _, day := range stats.WeeklyProgress {
			if day.Questions > 0 {
				studyDays++
			}
		}
		insights.ConsistencyScore = float64(studyDays) / 7.0
	}

	// 最佳学习时间
	if stats.StudyTime.BestDay != "" {
		insights.OptimalStudyTime = "上午 9:00-11:00"
	}

	// 建议频率
	if insights.ConsistencyScore > 0.8 {
		insights.SuggestedFrequency = "保持当前频率"
	} else if insights.ConsistencyScore > 0.5 {
		insights.SuggestedFrequency = "增加学习频率"
	} else {
		insights.SuggestedFrequency = "建立每日学习习惯"
	}

	stats.LearningInsights = insights
	return nil
}

// getAchievements 获取成就
func (as *AnalyticsService) getAchievements(userID string, stats *DashboardStats) error {
	achievements := []Achievement{
		{
			ID:          "first_review",
			Name:        "初次复习",
			Description: "完成第一次题目复习",
			Icon:        "🎯",
			Category:    "milestone",
			Progress:    min(stats.TodayReviewed, 1),
			Target:      1,
			Completed:   stats.TodayReviewed >= 1,
			XPReward:    10,
		},
		{
			ID:          "daily_goal",
			Name:        "每日目标",
			Description: "单日完成20题复习",
			Icon:        "📚",
			Category:    "daily",
			Progress:    min(stats.TodayReviewed, 20),
			Target:      20,
			Completed:   stats.TodayReviewed >= 20,
			XPReward:    50,
		},
		{
			ID:          "streak_master",
			Name:        "连击大师",
			Description: "达成10连击",
			Icon:        "🔥",
			Category:    "streak",
			Progress:    min(stats.CurrentStreak, 10),
			Target:      10,
			Completed:   stats.CurrentStreak >= 10,
			XPReward:    100,
		},
		{
			ID:          "accuracy_expert",
			Name:        "准确率专家",
			Description: "平均准确率达到90%",
			Icon:        "🎯",
			Category:    "accuracy",
			Progress:    int(math.Min(stats.AvgAccuracy, 90)),
			Target:      90,
			Completed:   stats.AvgAccuracy >= 90,
			XPReward:    200,
		},
		{
			ID:          "mastery_king",
			Name:        "掌握之王",
			Description: "掌握100道题目",
			Icon:        "👑",
			Category:    "mastery",
			Progress:    min(stats.MasteredQuestions, 100),
			Target:      100,
			Completed:   stats.MasteredQuestions >= 100,
			XPReward:    500,
		},
	}

	stats.Achievements = achievements
	return nil
}

// getRecommendations 获取学习建议
func (as *AnalyticsService) getRecommendations(userID string, stats *DashboardStats) error {
	var recommendations []Recommendation

	// 基于当前表现给出建议
	if stats.DueQuestions > 10 {
		recommendations = append(recommendations, Recommendation{
			Type:        "urgent",
			Title:       "有大量题目待复习",
			Description: fmt.Sprintf("您有 %d 道题目需要复习，建议优先处理", stats.DueQuestions),
			Priority:    5,
			Action:      "start_review",
		})
	}

	if stats.OverdueQuestions > 0 {
		recommendations = append(recommendations, Recommendation{
			Type:        "warning",
			Title:       "有逾期题目",
			Description: fmt.Sprintf("您有 %d 道题目已逾期，建议立即复习", stats.OverdueQuestions),
			Priority:    4,
			Action:      "review_overdue",
		})
	}

	if stats.UnresolvedWrong > 5 {
		recommendations = append(recommendations, Recommendation{
			Type:        "improvement",
			Title:       "重点关注错题",
			Description: fmt.Sprintf("您有 %d 道未解决的错题，建议加强练习", stats.UnresolvedWrong),
			Priority:    3,
			Action:      "practice_wrong",
		})
	}

	if stats.CurrentStreak >= 5 {
		recommendations = append(recommendations, Recommendation{
			Type:        "motivation",
			Title:       "保持连击状态",
			Description: fmt.Sprintf("太棒了！您已经连续答对 %d 题，继续保持！", stats.CurrentStreak),
			Priority:    2,
			Action:      "continue_streak",
		})
	}

	if stats.AvgAccuracy < 60 {
		recommendations = append(recommendations, Recommendation{
			Type:        "study_plan",
			Title:       "提高准确率",
			Description: "建议放慢学习节奏，重点理解题目内容",
			Priority:    4,
			Action:      "adjust_pace",
		})
	}

	// 基于弱项给出建议
	for _, perf := range stats.TypePerformance {
		if perf.Accuracy < 50 && perf.Reviewed > 10 {
			recommendations = append(recommendations, Recommendation{
				Type:        "skill_focus",
				Title:       fmt.Sprintf("加强%s练习", perf.TypeLabel),
				Description: fmt.Sprintf("您在%s方面的准确率为 %.1f%%，建议针对性练习", perf.TypeLabel, perf.Accuracy),
				Priority:    3,
				Action:      "focus_type",
				Data:        map[string]string{"type": perf.Type},
			})
		}
	}

	// 按优先级排序
	sort.Slice(recommendations, func(i, j int) bool {
		return recommendations[i].Priority > recommendations[j].Priority
	})

	// 限制数量
	if len(recommendations) > 5 {
		recommendations = recommendations[:5]
	}

	stats.Recommendations = recommendations
	return nil
}

// calculateImprovement 计算指定题型的改进度
func (as *AnalyticsService) calculateImprovement(userID string, questionType string) float64 {
	now := time.Now()
	past30Days := now.AddDate(0, 0, -30)
	past60Days := now.AddDate(0, 0, -60)

	// 获取最近30天的准确率
	var recentResult struct {
		TotalSessions int
		CorrectCount  int
	}
	as.db.Model(&models.ReviewSession{}).
		Select("COUNT(*) as total_sessions, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count").
		Joins("JOIN questions ON questions.id = review_sessions.question_id").
		Where("review_sessions.user_id = ? AND questions.question_type = ? AND review_sessions.created_at >= ?",
			userID, questionType, past30Days).
		Scan(&recentResult)

	// 获取30-60天前的准确率
	var previousResult struct {
		TotalSessions int
		CorrectCount  int
	}
	as.db.Model(&models.ReviewSession{}).
		Select("COUNT(*) as total_sessions, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count").
		Joins("JOIN questions ON questions.id = review_sessions.question_id").
		Where("review_sessions.user_id = ? AND questions.question_type = ? AND review_sessions.created_at >= ? AND review_sessions.created_at < ?",
			userID, questionType, past60Days, past30Days).
		Scan(&previousResult)

	// 计算准确率
	recentAccuracy := 0.0
	if recentResult.TotalSessions > 0 {
		recentAccuracy = float64(recentResult.CorrectCount) / float64(recentResult.TotalSessions)
	}

	previousAccuracy := 0.0
	if previousResult.TotalSessions > 0 {
		previousAccuracy = float64(previousResult.CorrectCount) / float64(previousResult.TotalSessions)
	}

	// 返回改进度百分比
	if previousAccuracy == 0 && recentAccuracy > 0 {
		return 100.0 // 从无到有的改进
	}
	if previousAccuracy == 0 {
		return 0.0
	}

	improvement := ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100
	return math.Round(improvement*100) / 100 // 保留两位小数
}

// calculateNewLearnedQuestions 计算指定时间段内新学习的题目数量
func (as *AnalyticsService) calculateNewLearnedQuestions(userID string, startTime, endTime time.Time) int {
	var newLearnedCount int64

	// 查找该时间段内首次复习的题目（即新学习的题目）
	// 通过子查询找出每个题目的首次复习时间，然后筛选在指定时间段内的
	subQuery := as.db.Model(&models.ReviewSession{}).
		Select("question_id, MIN(created_at) as first_review").
		Where("user_id = ?", userID).
		Group("question_id")

	as.db.Table("(?) as first_reviews", subQuery).
		Select("COUNT(*)").
		Where("first_review >= ? AND first_review < ?", startTime, endTime).
		Scan(&newLearnedCount)

	return int(newLearnedCount)
}

// 辅助函数
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func minFloat(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}