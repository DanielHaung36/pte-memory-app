package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
	"pte-memory-backend/models"
)

// ImportResult 导入结果
type ImportResult struct {
	TotalRows     int      `json:"total_rows"`
	SuccessCount  int      `json:"success_count"`
	ErrorCount    int      `json:"error_count"`
	Errors        []string `json:"errors"`
	SuccessIDs    []string `json:"success_ids"`
}

// QuestionImportRow Excel 行数据
type QuestionImportRow struct {
	RowNumber      int
	Content        string
	QuestionType   string
	Difficulty     string
	CorrectAnswer  string
	Explanation    string
	AudioURL       string
	AudioFilename  string
	ImageURL       string
	Tags           []string
	Category       string
	Priority       int
	InitialInterval int
	EaseFactor     float64
	Notes          string
}

// WrongQuestionImportRow 错题导入行数据
type WrongQuestionImportRow struct {
	RowNumber      int
	QuestionID     string
	ErrorType      string
	UserAnswer     string
	CorrectAnswer  string
	ErrorReason    string
	Priority       int
	Tags           []string
	Notes          string
}

// ParseQuestionsFromExcel 从 Excel 解析题目数据
func ParseQuestionsFromExcel(file *excelize.File) ([]QuestionImportRow, error) {
	sheetName := file.GetSheetName(0)
	if sheetName == "" {
		return nil, errors.New("Excel 文件没有工作表")
	}

	rows, err := file.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("读取 Excel 失败: %v", err)
	}

	if len(rows) < 2 {
		return nil, errors.New("Excel 文件没有数据（至少需要标题行和一行数据）")
	}

	// 解析标题行，建立列索引
	headers := rows[0]
	columnMap := make(map[string]int)
	for i, header := range headers {
		columnMap[strings.TrimSpace(header)] = i
	}

	var questions []QuestionImportRow
	for i, row := range rows[1:] {
		if len(row) == 0 {
			continue // 跳过空行
		}

		q := QuestionImportRow{
			RowNumber:       i + 2, // Excel 行号从1开始，加1是标题行
			Priority:        3,     // 默认优先级
			InitialInterval: 1,     // 默认初始间隔1天
			EaseFactor:      2.5,   // 默认ease factor
		}

		// 读取必填字段
		q.Content = getColumnValue(row, columnMap, "content")
		q.QuestionType = getColumnValue(row, columnMap, "question_type")
		q.Difficulty = getColumnValue(row, columnMap, "difficulty")
		q.CorrectAnswer = getColumnValue(row, columnMap, "correct_answer")

		// 读取可选字段
		q.Explanation = getColumnValue(row, columnMap, "explanation")
		q.AudioURL = getColumnValue(row, columnMap, "audio_url")
		q.AudioFilename = getColumnValue(row, columnMap, "audio_filename")
		q.ImageURL = getColumnValue(row, columnMap, "image_url")
		q.Category = getColumnValue(row, columnMap, "category")
		q.Notes = getColumnValue(row, columnMap, "notes")

		// 读取标签（逗号分隔）
		tagsStr := getColumnValue(row, columnMap, "tags")
		if tagsStr != "" {
			q.Tags = strings.Split(tagsStr, ",")
			for i := range q.Tags {
				q.Tags[i] = strings.TrimSpace(q.Tags[i])
			}
		}

		// 读取数值字段
		if priorityStr := getColumnValue(row, columnMap, "priority"); priorityStr != "" {
			if p, err := strconv.Atoi(priorityStr); err == nil && p >= 1 && p <= 5 {
				q.Priority = p
			}
		}

		if intervalStr := getColumnValue(row, columnMap, "initial_interval"); intervalStr != "" {
			if interval, err := strconv.Atoi(intervalStr); err == nil && interval > 0 {
				q.InitialInterval = interval
			}
		}

		if easeStr := getColumnValue(row, columnMap, "ease_factor"); easeStr != "" {
			if ease, err := strconv.ParseFloat(easeStr, 64); err == nil && ease >= 1.3 && ease <= 2.5 {
				q.EaseFactor = ease
			}
		}

		questions = append(questions, q)
	}

	return questions, nil
}

// ValidateQuestionRow 验证题目行数据
func ValidateQuestionRow(q *QuestionImportRow) error {
	// 验证必填字段
	if strings.TrimSpace(q.Content) == "" {
		return fmt.Errorf("第 %d 行: 题目内容不能为空", q.RowNumber)
	}

	if strings.TrimSpace(q.QuestionType) == "" {
		return fmt.Errorf("第 %d 行: 题目类型不能为空", q.RowNumber)
	}

	// 验证题目类型
	validTypes := map[string]bool{
		"Speaking": true, "Writing": true, "Reading": true, "Listening": true,
		// PTE 具体题型
		"Read Aloud": true, "Repeat Sentence": true, "Describe Image": true,
		"Re-tell Lecture": true, "Answer Short Question": true,
		"Summarize Written Text": true, "Write Essay": true,
		"Reading & Writing: Fill in the Blanks": true,
		"Re-order Paragraphs": true, "Reading: Fill in the Blanks": true,
		"Summarize Spoken Text": true,
		"Fill in the Blanks": true, "Highlight Correct Summary": true,
		"Select Missing Word": true,
		"Highlight Incorrect Words": true, "Write from Dictation": true,
		"Multiple Choice Single": true, "Multiple Choice Multiple": true,
		// IELTS 题型
		"IELTS Speaking Part 1": true, "IELTS Speaking Part 2": true,
		"IELTS Speaking Part 3": true, "IELTS Writing Task 1": true,
		"IELTS Writing Task 2": true, "IELTS Reading": true, "IELTS Listening": true,
	}

	if !validTypes[q.QuestionType] {
		return fmt.Errorf("第 %d 行: 无效的题目类型 '%s'", q.RowNumber, q.QuestionType)
	}

	// 验证难度
	validDifficulties := map[string]bool{
		"Easy": true, "Medium": true, "Hard": true, "VeryHard": true, "Expert": true,
	}

	if q.Difficulty != "" && !validDifficulties[q.Difficulty] {
		return fmt.Errorf("第 %d 行: 无效的难度级别 '%s'（应为 Easy/Medium/Hard/VeryHard/Expert）", q.RowNumber, q.Difficulty)
	}

	if strings.TrimSpace(q.CorrectAnswer) == "" {
		return fmt.Errorf("第 %d 行: 正确答案不能为空", q.RowNumber)
	}

	// 验证优先级
	if q.Priority < 1 || q.Priority > 5 {
		return fmt.Errorf("第 %d 行: 优先级必须在 1-5 之间", q.RowNumber)
	}

	return nil
}

// ImportQuestionsToDatabase 批量导入题目到数据库
func ImportQuestionsToDatabase(db *gorm.DB, userID string, questions []QuestionImportRow, uploadedAudioMap map[string]string) *ImportResult {
	result := &ImportResult{
		TotalRows:    len(questions),
		SuccessCount: 0,
		ErrorCount:   0,
		Errors:       []string{},
		SuccessIDs:   []string{},
	}

	for _, q := range questions {
		// 验证数据
		if err := ValidateQuestionRow(&q); err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		// 处理音频：优先使用 AudioURL，其次使用已上传文件映射
		audioURL := q.AudioURL
		if audioURL == "" && q.AudioFilename != "" {
			if uploadedURL, ok := uploadedAudioMap[q.AudioFilename]; ok {
				audioURL = uploadedURL
			}
		}

		// 将 string difficulty 转换为 DifficultyLevel int
		difficultyLevel := parseDifficultyLevel(q.Difficulty)

		// 生成标题（使用内容的前50个字符）
		title := q.Content
		if len(title) > 50 {
			title = title[:50] + "..."
		}

		// 创建题目
		question := models.Question{
			UserID:          userID,
			Title:           title,
			Content:         q.Content,
			QuestionType:    parseQuestionType(q.QuestionType),
			DifficultyLevel: difficultyLevel,
			CorrectAnswer:   q.CorrectAnswer,
			Explanation:     q.Explanation,
			AudioURL:        audioURL,
			ImageURL:        q.ImageURL,
			Tags:            q.Tags,
		}

		if err := db.Create(&question).Error; err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("第 %d 行: 创建题目失败 - %v", q.RowNumber, err))
			continue
		}

		// 创建复习计划
		schedule := models.ReviewSchedule{
			QuestionID:      question.ID,
			UserID:          userID,
			RepetitionCount: 0,
			EaseFactor:      q.EaseFactor,
			CurrentInterval: q.InitialInterval,
			NextReviewDate:  time.Now().AddDate(0, 0, q.InitialInterval),
			Priority:        q.Priority,
		}

		if err := db.Create(&schedule).Error; err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("第 %d 行: 创建复习计划失败 - %v", q.RowNumber, err))
			// 回滚题目创建
			db.Delete(&question)
			continue
		}

		result.SuccessCount++
		result.SuccessIDs = append(result.SuccessIDs, question.ID)
	}

	return result
}

// ParseWrongQuestionsFromExcel 从 Excel 解析错题数据
func ParseWrongQuestionsFromExcel(file *excelize.File) ([]WrongQuestionImportRow, error) {
	sheetName := file.GetSheetName(0)
	if sheetName == "" {
		return nil, errors.New("Excel 文件没有工作表")
	}

	rows, err := file.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("读取 Excel 失败: %v", err)
	}

	if len(rows) < 2 {
		return nil, errors.New("Excel 文件没有数据（至少需要标题行和一行数据）")
	}

	headers := rows[0]
	columnMap := make(map[string]int)
	for i, header := range headers {
		columnMap[strings.TrimSpace(header)] = i
	}

	var wrongQuestions []WrongQuestionImportRow
	for i, row := range rows[1:] {
		if len(row) == 0 {
			continue
		}

		wq := WrongQuestionImportRow{
			RowNumber: i + 2,
			Priority:  3, // 默认优先级
		}

		wq.QuestionID = getColumnValue(row, columnMap, "question_id")
		wq.ErrorType = getColumnValue(row, columnMap, "error_type")
		wq.UserAnswer = getColumnValue(row, columnMap, "user_answer")
		wq.CorrectAnswer = getColumnValue(row, columnMap, "correct_answer")
		wq.ErrorReason = getColumnValue(row, columnMap, "error_reason")
		wq.Notes = getColumnValue(row, columnMap, "notes")

		// 读取标签
		tagsStr := getColumnValue(row, columnMap, "tags")
		if tagsStr != "" {
			wq.Tags = strings.Split(tagsStr, ",")
			for i := range wq.Tags {
				wq.Tags[i] = strings.TrimSpace(wq.Tags[i])
			}
		}

		// 读取优先级
		if priorityStr := getColumnValue(row, columnMap, "priority"); priorityStr != "" {
			if p, err := strconv.Atoi(priorityStr); err == nil && p >= 1 && p <= 5 {
				wq.Priority = p
			}
		}

		wrongQuestions = append(wrongQuestions, wq)
	}

	return wrongQuestions, nil
}

// ValidateWrongQuestionRow 验证错题行数据
func ValidateWrongQuestionRow(wq *WrongQuestionImportRow) error {
	if strings.TrimSpace(wq.QuestionID) == "" {
		return fmt.Errorf("第 %d 行: 题目ID不能为空", wq.RowNumber)
	}

	if strings.TrimSpace(wq.ErrorType) == "" {
		return fmt.Errorf("第 %d 行: 错误类型不能为空", wq.RowNumber)
	}

	if wq.Priority < 1 || wq.Priority > 5 {
		return fmt.Errorf("第 %d 行: 优先级必须在 1-5 之间", wq.RowNumber)
	}

	return nil
}

// ImportWrongQuestionsToDatabase 批量导入错题到数据库
func ImportWrongQuestionsToDatabase(db *gorm.DB, userID string, wrongQuestions []WrongQuestionImportRow) *ImportResult {
	result := &ImportResult{
		TotalRows:    len(wrongQuestions),
		SuccessCount: 0,
		ErrorCount:   0,
		Errors:       []string{},
		SuccessIDs:   []string{},
	}

	for _, wq := range wrongQuestions {
		if err := ValidateWrongQuestionRow(&wq); err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, err.Error())
			continue
		}

		// 检查题目是否存在
		var question models.Question
		if err := db.First(&question, "id = ? AND user_id = ?", wq.QuestionID, userID).Error; err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("第 %d 行: 题目 ID '%s' 不存在", wq.RowNumber, wq.QuestionID))
			continue
		}

		// 创建错题记录
		wrongQuestion := models.WrongQuestion{
			UserID:        userID,
			QuestionID:    wq.QuestionID,
			ErrorType:     wq.ErrorType,
			UserAnswer:    wq.UserAnswer,
			CorrectAnswer: wq.CorrectAnswer,
			ErrorReason:   wq.ErrorReason,
			Priority:      wq.Priority,
			Tags:          wq.Tags,
			Notes:         wq.Notes,
			IsResolved:    false,
			TimesWrong:    1,
			LastWrongAt:   time.Now(),
		}

		if err := db.Create(&wrongQuestion).Error; err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("第 %d 行: 创建错题失败 - %v", wq.RowNumber, err))
			continue
		}

		result.SuccessCount++
		result.SuccessIDs = append(result.SuccessIDs, wrongQuestion.ID)
	}

	return result
}

// GenerateQuestionTemplate 生成题目导入模板
func GenerateQuestionTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	sheetName := "Sheet1"

	// 设置标题行
	headers := []string{
		"content", "question_type", "difficulty", "correct_answer", "explanation",
		"audio_url", "audio_filename", "image_url", "tags", "category",
		"priority", "initial_interval", "ease_factor", "notes",
	}

	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	// 添加示例行
	exampleRow := []interface{}{
		"What is the capital of France?",
		"Multiple Choice (Single)",
		"Easy",
		"Paris",
		"Paris is the capital and largest city of France.",
		"https://example.com/audio.mp3",
		"question_1.mp3",
		"https://example.com/image.jpg",
		"geography, capitals",
		"Geography",
		3,
		1,
		2.5,
		"Sample question for import",
	}

	for i, value := range exampleRow {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, value)
	}

	// 设置列宽
	for i := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth(sheetName, col, col, 20)
	}

	return f, nil
}

// GenerateWrongQuestionTemplate 生成错题导入模板
func GenerateWrongQuestionTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	sheetName := "Sheet1"

	headers := []string{
		"question_id", "error_type", "user_answer", "correct_answer",
		"error_reason", "priority", "tags", "notes",
	}

	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	exampleRow := []interface{}{
		"123e4567-e89b-12d3-a456-426614174000",
		"grammar",
		"The cat are sleeping",
		"The cat is sleeping",
		"Subject-verb agreement error",
		4,
		"grammar, tense",
		"Need to review subject-verb agreement",
	}

	for i, value := range exampleRow {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, value)
	}

	for i := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth(sheetName, col, col, 20)
	}

	return f, nil
}

// 辅助函数：获取列值
func getColumnValue(row []string, columnMap map[string]int, columnName string) string {
	if idx, ok := columnMap[columnName]; ok && idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

// 辅助函数：解析难度级别
func parseDifficultyLevel(difficulty string) models.DifficultyLevel {
	switch strings.ToLower(difficulty) {
	case "easy":
		return models.Easy
	case "medium":
		return models.Medium
	case "hard":
		return models.Hard
	case "veryhard", "very hard":
		return models.VeryHard
	case "expert":
		return models.Expert
	default:
		return models.Medium // 默认中等难度
	}
}

// 辅助函数：解析题目类型
func parseQuestionType(questionType string) models.QuestionType {
	lowerType := strings.ToLower(questionType)
	if strings.Contains(lowerType, "speaking") || strings.Contains(lowerType, "read aloud") ||
		strings.Contains(lowerType, "repeat") || strings.Contains(lowerType, "describe") {
		return models.Speaking
	}
	if strings.Contains(lowerType, "writing") || strings.Contains(lowerType, "essay") ||
		strings.Contains(lowerType, "summarize written") {
		return models.Writing
	}
	if strings.Contains(lowerType, "reading") {
		return models.Reading
	}
	if strings.Contains(lowerType, "listening") {
		return models.Listening
	}
	// 默认返回 Reading
	return models.Reading
}
