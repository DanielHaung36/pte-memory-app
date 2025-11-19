package controllers

import (
	"net/http"
	"pte-memory-backend/database"
	"pte-memory-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetPTEPracticeQuestions 获取PTE练习题
// GET /api/exams/pte/practice?type=speaking&subtype=read_aloud&limit=10
func GetPTEPracticeQuestions(c *gin.Context) {
	userID := c.GetString("user_id")
	questionType := c.Query("type")
	subType := c.Query("subtype")
	limitStr := c.DefaultQuery("limit", "10")

	limit, _ := strconv.Atoi(limitStr)
	if limit > 50 {
		limit = 50
	}

	var questions []models.Question
	query := database.DB.Where("exam_type = ? AND user_id = ?", "PTE", userID)

	if questionType != "" {
		query = query.Where("question_type = ?", questionType)
	}
	if subType != "" {
		query = query.Where("sub_type = ?", subType)
	}

	if err := query.Limit(limit).Order("created_at DESC").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     len(questions),
		"exam_type": "PTE",
	})
}

// GetIELTSPracticeQuestions 获取雅思练习题
// GET /api/exams/ielts/practice?type=writing&task=task2&module=academic&limit=10
func GetIELTSPracticeQuestions(c *gin.Context) {
	userID := c.GetString("user_id")
	questionType := c.Query("type")
	task := c.Query("task")
	module := c.DefaultQuery("module", "academic")
	limitStr := c.DefaultQuery("limit", "10")

	limit, _ := strconv.Atoi(limitStr)
	if limit > 50 {
		limit = 50
	}

	var questions []models.Question
	query := database.DB.Where("exam_type = ? AND user_id = ?", "IELTS", userID)

	if questionType != "" {
		query = query.Where("question_type = ?", questionType)
	}
	if task != "" {
		query = query.Where("sub_type = ?", task)
	}
	if module != "" {
		query = query.Where("exam_module = ?", module)
	}

	if err := query.Limit(limit).Order("created_at DESC").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     len(questions),
		"exam_type": "IELTS",
		"module":    module,
	})
}

// GetPublicPracticeQuestions 获取公开免费练习题
// GET /api/exams/public/practice?exam_type=PTE&type=speaking&limit=10
func GetPublicPracticeQuestions(c *gin.Context) {
	examType := c.Query("exam_type")
	questionType := c.Query("type")
	subType := c.Query("subtype")
	limitStr := c.DefaultQuery("limit", "20")

	limit, _ := strconv.Atoi(limitStr)
	if limit > 100 {
		limit = 100
	}

	var questions []models.Question
	query := database.DB.Where("is_free_question = ? AND verification_status = ?", true, "approved")

	if examType != "" {
		query = query.Where("exam_type = ?", examType)
	}
	if questionType != "" {
		query = query.Where("question_type = ?", questionType)
	}
	if subType != "" {
		query = query.Where("sub_type = ?", subType)
	}

	if err := query.Limit(limit).Order("like_count DESC, download_count DESC").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取题目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     len(questions),
	})
}

// StartMockTest 开始模拟考试（新版：支持会话管理）
// POST /api/exams/mock-test/start
func StartMockTest(c *gin.Context) {
	userID := c.GetString("user_id")

	var input struct {
		ExamType     string   `json:"exam_type" binding:"required"` // PTE/IELTS
		Module       string   `json:"module"`                       // Academic/General
		TestType     string   `json:"test_type"`                    // Full/Speaking/Writing/etc
		QuestionIDs  []string `json:"question_ids"`                 // 可选：指定题目
		TimeLimit    int      `json:"time_limit"`                   // 可选：考试时限（秒）
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查是否有未完成的会话
	activeSession, err := models.GetActiveExamSession(database.DB, userID)
	if err == nil && activeSession != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":      "你有一个未完成的考试会话",
			"session_id": activeSession.ID,
			"message":    "请先完成或放弃当前会话",
		})
		return
	}

	// 获取考试题目
	var questions []models.Question
	if len(input.QuestionIDs) > 0 {
		// 使用指定题目
		database.DB.Where("id IN ?", input.QuestionIDs).Find(&questions)
	} else {
		// 自动选择题目
		query := database.DB.Where("exam_type = ?", input.ExamType)
		if input.Module != "" {
			query = query.Where("exam_module = ?", input.Module)
		}
		query.Limit(20).Order("RANDOM()").Find(&questions)
	}

	if len(questions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "没有找到合适的题目"})
		return
	}

	// 提取题目ID
	questionIDs := make([]string, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.ID
	}

	// 创建考试会话
	examSession := models.ExamSession{
		UserID:         userID,
		ExamType:       input.ExamType,
		ExamModule:     input.Module,
		TestType:       input.TestType,
		Status:         "active",
		TotalQuestions: len(questions),
		QuestionIDs:    questionIDs,
		TimeLimit:      input.TimeLimit,
	}

	if err := models.CreateExamSession(database.DB, &examSession); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建考试会话失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id":     examSession.ID,
		"questions":      questions,
		"exam_type":      input.ExamType,
		"module":         input.Module,
		"total_questions": len(questions),
		"time_limit":     input.TimeLimit,
		"started_at":     examSession.StartedAt,
		"status":         examSession.Status,
	})
}

// PauseExamSession 暂停考试
// POST /api/exams/sessions/:id/pause
func PauseExamSession(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权操作此会话"})
		return
	}

	if session.Status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只能暂停进行中的考试"})
		return
	}

	session.Pause()
	if err := models.UpdateExamSession(database.DB, session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "暂停失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "考试已暂停",
		"status":    session.Status,
		"paused_at": session.PausedAt,
	})
}

// ResumeExamSession 恢复考试
// POST /api/exams/sessions/:id/resume
func ResumeExamSession(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权操作此会话"})
		return
	}

	if session.Status != "paused" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只能恢复已暂停的考试"})
		return
	}

	session.Resume()
	if err := models.UpdateExamSession(database.DB, session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "恢复失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "考试已恢复",
		"status":     session.Status,
		"resumed_at": session.ResumedAt,
	})
}

// SubmitAnswer 提交答案
// POST /api/exams/sessions/:id/submit-answer
func SubmitAnswer(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	var input struct {
		QuestionID      string `json:"question_id" binding:"required"`
		UserAnswer      string `json:"user_answer"`
		TimeSpent       int    `json:"time_spent"`
		ConfidenceLevel int    `json:"confidence_level"`
		IsSkipped       bool   `json:"is_skipped"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权操作此会话"})
		return
	}

	// 获取题目信息
	var question models.Question
	if err := database.DB.First(&question, "id = ?", input.QuestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	// 判断答案是否正确
	isCorrect := !input.IsSkipped && (input.UserAnswer == question.CorrectAnswer)

	// 创建答题记录
	answerRecord := models.AnswerRecord{
		QuestionID:      input.QuestionID,
		QuestionType:    string(question.QuestionType),
		UserAnswer:      input.UserAnswer,
		CorrectAnswer:   question.CorrectAnswer,
		IsCorrect:       isCorrect,
		TimeSpent:       input.TimeSpent,
		ConfidenceLevel: input.ConfidenceLevel,
		IsSkipped:       input.IsSkipped,
		AnsweredAt:      time.Now(),
		Score:           calculateQuestionScore(isCorrect, input.ConfidenceLevel),
	}

	// 添加到会话
	session.AddAnswer(answerRecord)

	// 如果是最后一题，自动完成考试
	if session.CurrentQuestionIndex >= session.TotalQuestions {
		session.Complete()
		session.CalculateScores()
	}

	if err := models.UpdateExamSession(database.DB, session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存答案失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "答案已提交",
		"is_correct":      isCorrect,
		"correct_answer":  question.CorrectAnswer,
		"progress":        session.GetProgress(),
		"current_index":   session.CurrentQuestionIndex,
		"total_questions": session.TotalQuestions,
		"status":          session.Status,
	})
}

// CompleteExamSession 完成考试
// POST /api/exams/sessions/:id/complete
func CompleteExamSession(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权操作此会话"})
		return
	}

	if session.Status == "completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "考试已完成"})
		return
	}

	session.Complete()
	session.CalculateScores()

	if err := models.UpdateExamSession(database.DB, session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "完成考试失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "考试已完成",
		"session_id":       session.ID,
		"total_score":      session.TotalScore,
		"score_breakdown":  session.ScoreBreakdown,
		"questions_answered": session.QuestionsAnswered,
		"correct_answers":  session.CorrectAnswers,
		"wrong_answers":    session.WrongAnswers,
		"time_spent":       session.TimeSpent,
		"completed_at":     session.CompletedAt,
	})
}

// GetExamSession 获取考试会话详情
// GET /api/exams/sessions/:id
func GetExamSessionDetail(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权查看此会话"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session": session,
		"progress": session.GetProgress(),
	})
}

// GetExamSessions 获取用户的考试会话列表
// GET /api/exams/sessions
func GetExamSessions(c *gin.Context) {
	userID := c.GetString("user_id")
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "20")

	limit, _ := strconv.Atoi(limitStr)
	if limit > 100 {
		limit = 100
	}

	sessions, err := models.GetUserExamSessions(database.DB, userID, status, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取会话列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    len(sessions),
	})
}

// GetExamReport 获取考试分析报告
// GET /api/exams/sessions/:id/report
func GetExamReport(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")

	session, err := models.GetExamSession(database.DB, sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "考试会话不存在"})
		return
	}

	if session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权查看此报告"})
		return
	}

	if !session.IsCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "考试未完成，无法生成报告"})
		return
	}

	// 生成详细报告
	report := generateExamReport(session)

	c.JSON(http.StatusOK, report)
}

// 辅助函数

// calculateQuestionScore 计算题目得分
func calculateQuestionScore(isCorrect bool, confidenceLevel int) float64 {
	if !isCorrect {
		return 0
	}

	// 基础分
	baseScore := 10.0

	// 根据信心等级加成
	confidenceBonus := float64(confidenceLevel) * 0.5

	return baseScore + confidenceBonus
}

// generateExamReport 生成考试分析报告
func generateExamReport(session *models.ExamSession) map[string]interface{} {
	report := make(map[string]interface{})

	// 基础信息
	report["session_id"] = session.ID
	report["exam_type"] = session.ExamType
	report["completed_at"] = session.CompletedAt
	report["time_spent"] = session.TimeSpent

	// 总体成绩
	report["overall_score"] = session.TotalScore
	report["score_breakdown"] = session.ScoreBreakdown

	// 答题统计
	report["statistics"] = map[string]interface{}{
		"total_questions":    session.TotalQuestions,
		"questions_answered": session.QuestionsAnswered,
		"correct_answers":    session.CorrectAnswers,
		"wrong_answers":      session.WrongAnswers,
		"skipped_questions":  session.SkippedQuestions,
		"accuracy_rate":      float64(session.CorrectAnswers) / float64(session.QuestionsAnswered) * 100,
	}

	// 错题分析
	wrongAnswers := []models.AnswerRecord{}
	weakPoints := make(map[string]int)

	for _, answer := range session.Answers {
		if !answer.IsCorrect && !answer.IsSkipped {
			wrongAnswers = append(wrongAnswers, answer)
			weakPoints[answer.QuestionType]++
		}
	}

	report["wrong_answers"] = wrongAnswers
	report["weak_points"] = weakPoints

	// 薄弱题型排序
	type WeakPoint struct {
		Type  string `json:"type"`
		Count int    `json:"count"`
	}
	var weakPointsList []WeakPoint
	for typ, count := range weakPoints {
		weakPointsList = append(weakPointsList, WeakPoint{Type: typ, Count: count})
	}

	report["weak_points_ranked"] = weakPointsList

	// 时间分析
	totalTimeSpent := 0
	for _, answer := range session.Answers {
		totalTimeSpent += answer.TimeSpent
	}
	avgTimePerQuestion := 0
	if len(session.Answers) > 0 {
		avgTimePerQuestion = totalTimeSpent / len(session.Answers)
	}

	report["time_analysis"] = map[string]interface{}{
		"total_time":            session.TimeSpent,
		"pause_duration":        session.PauseDuration,
		"effective_time":        session.TimeSpent - session.PauseDuration,
		"avg_time_per_question": avgTimePerQuestion,
	}

	// 建议
	suggestions := []string{}
	if session.TotalScore < 60 {
		suggestions = append(suggestions, "整体表现需要加强，建议增加练习时间")
	}
	if session.ScoreBreakdown.Speaking.Percentage < 60 {
		suggestions = append(suggestions, "口语部分较薄弱，建议加强口语练习")
	}
	if session.ScoreBreakdown.Writing.Percentage < 60 {
		suggestions = append(suggestions, "写作部分需要提升，建议多练习写作技巧")
	}
	if session.ScoreBreakdown.Reading.Percentage < 60 {
		suggestions = append(suggestions, "阅读理解需要加强，建议增加阅读量")
	}
	if session.ScoreBreakdown.Listening.Percentage < 60 {
		suggestions = append(suggestions, "听力部分需要改进，建议多做听力训练")
	}

	report["suggestions"] = suggestions

	return report
}

// GetExamStatistics 获取考试统计
// GET /api/exams/statistics?exam_type=PTE
func GetExamStatistics(c *gin.Context) {
	userID := c.GetString("user_id")
	examType := c.Query("exam_type")

	var stats struct {
		TotalQuestions   int64   `json:"total_questions"`
		ReviewedCount    int64   `json:"reviewed_count"`
		CorrectCount     int64   `json:"correct_count"`
		AccuracyRate     float64 `json:"accuracy_rate"`
		BySubType        []struct {
			SubType      string  `json:"sub_type"`
			Total        int64   `json:"total"`
			Correct      int64   `json:"correct"`
			AccuracyRate float64 `json:"accuracy_rate"`
		} `json:"by_sub_type"`
	}

	// 总题数
	query := database.DB.Model(&models.Question{}).Where("user_id = ?", userID)
	if examType != "" {
		query = query.Where("exam_type = ?", examType)
	}
	query.Count(&stats.TotalQuestions)

	// 复习次数和正确率
	sessionQuery := database.DB.Model(&models.ReviewSession{}).
		Joins("JOIN questions ON questions.id = review_sessions.question_id").
		Where("review_sessions.user_id = ?", userID)
	if examType != "" {
		sessionQuery = sessionQuery.Where("questions.exam_type = ?", examType)
	}
	sessionQuery.Count(&stats.ReviewedCount)
	sessionQuery.Where("review_sessions.is_correct = ?", true).Count(&stats.CorrectCount)

	if stats.ReviewedCount > 0 {
		stats.AccuracyRate = float64(stats.CorrectCount) / float64(stats.ReviewedCount) * 100
	}

	// 按题型统计
	database.DB.Raw(`
		SELECT
			q.sub_type,
			COUNT(DISTINCT q.id) as total,
			COUNT(CASE WHEN rs.is_correct = true THEN 1 END) as correct,
			CASE
				WHEN COUNT(rs.id) > 0
				THEN CAST(COUNT(CASE WHEN rs.is_correct = true THEN 1 END) AS FLOAT) / COUNT(rs.id) * 100
				ELSE 0
			END as accuracy_rate
		FROM questions q
		LEFT JOIN review_sessions rs ON q.id = rs.question_id
		WHERE q.user_id = ? AND q.exam_type = ?
		GROUP BY q.sub_type
		ORDER BY accuracy_rate ASC
	`, userID, examType).Scan(&stats.BySubType)

	c.JSON(http.StatusOK, stats)
}

// GetQuestionTypes 获取支持的题型列表
// GET /api/exams/question-types?exam_type=PTE
func GetQuestionTypes(c *gin.Context) {
	examType := c.Query("exam_type")

	var questionTypes map[string]interface{}

	if examType == "PTE" {
		questionTypes = map[string]interface{}{
			"speaking": []string{
				models.PTEReadAloud,
				models.PTERepeatSentence,
				models.PTEDescribeImage,
				models.PTERetellLecture,
				models.PTEAnswerShortQuestion,
			},
			"writing": []string{
				models.PTESummarizeWrittenText,
				models.PTEWriteEssay,
			},
			"reading": []string{
				models.PTEMultipleChoice,
				models.PTEMultipleChoiceMulti,
				models.PTEReorderParagraphs,
				models.PTEReadingFillBlanks,
			},
			"listening": []string{
				models.PTESummarizeSpokenText,
				models.PTEListeningMultiChoice,
				models.PTEFillBlanksListening,
				models.PTEWriteFromDictation,
			},
		}
	} else if examType == "IELTS" {
		questionTypes = map[string]interface{}{
			"speaking": []string{
				models.IELTSSpeakingPart1,
				models.IELTSSpeakingPart2,
				models.IELTSSpeakingPart3,
			},
			"writing": []string{
				models.IELTSTask1Academic,
				models.IELTSTask1General,
				models.IELTSTask2,
			},
			"reading": []string{
				models.IELTSTrueFalseNotGiven,
				models.IELTSMatchingHeadings,
				models.IELTSSentenceCompletion,
			},
			"listening": []string{
				models.IELTSFormCompletion,
				models.IELTSNoteCompletion,
				models.IELTSListeningMultiChoice,
			},
		}
	}

	c.JSON(http.StatusOK, questionTypes)
}

// LikeQuestion 点赞题目
// POST /api/exams/questions/:id/like
func LikeQuestion(c *gin.Context) {
	questionID := c.Param("id")
	userID := c.GetString("user_id")

	var question models.Question
	if err := database.DB.First(&question, "id = ?", questionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	// 检查是否已点赞（可以创建单独的Like表，这里简化处理）
	question.LikeCount++
	if err := database.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "点赞失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "点赞成功",
		"like_count": question.LikeCount,
		"user_id":    userID,
	})
}
