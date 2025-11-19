package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	"pte-memory-backend/database"
	"pte-memory-backend/services"
)

type ImportController struct {
	DB *gorm.DB
}

// PreviewQuestionsImport 预览题目导入
func (ic *ImportController) PreviewQuestionsImport(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	// 检查文件扩展名
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持 .xlsx 或 .xls 文件"})
		return
	}

	// 保存临时文件
	tempFilePath := filepath.Join("storage/temp", uuid.New().String()+ext)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 打开 Excel 文件
	f, err := excelize.OpenFile(tempFilePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法解析 Excel 文件"})
		return
	}
	defer f.Close()

	// 解析数据
	questions, err := services.ParseQuestionsFromExcel(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证数据
	var validCount int
	var errors []string
	for i := range questions {
		if err := services.ValidateQuestionRow(&questions[i]); err != nil {
			errors = append(errors, err.Error())
		} else {
			validCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "预览成功",
		"total_rows":    len(questions),
		"valid_count":   validCount,
		"invalid_count": len(errors),
		"errors":        errors,
		"preview_data":  questions[:minInt(10, len(questions))], // 返回前10行预览
	})
}

// ExecuteQuestionsImport 执行题目导入
func (ic *ImportController) ExecuteQuestionsImport(c *gin.Context) {
	userIDInterface, _ := c.Get("user_id")
	userID := userIDInterface.(string)

	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持 .xlsx 或 .xls 文件"})
		return
	}

	tempFilePath := filepath.Join("storage/temp", uuid.New().String()+ext)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	f, err := excelize.OpenFile(tempFilePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法解析 Excel 文件"})
		return
	}
	defer f.Close()

	questions, err := services.ParseQuestionsFromExcel(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取已上传音频文件映射（可选参数）
	var audioMap map[string]string
	if audioMapParam := c.PostForm("audio_map"); audioMapParam != "" {
		// TODO: 解析 audio_map JSON
		audioMap = make(map[string]string)
	} else {
		audioMap = make(map[string]string)
	}

	// 执行导入
	result := services.ImportQuestionsToDatabase(database.DB, userID, questions, audioMap)

	c.JSON(http.StatusOK, gin.H{
		"message": "导入完成",
		"result":  result,
	})
}

// PreviewWrongQuestionsImport 预览错题导入
func (ic *ImportController) PreviewWrongQuestionsImport(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持 .xlsx 或 .xls 文件"})
		return
	}

	tempFilePath := filepath.Join("storage/temp", uuid.New().String()+ext)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	f, err := excelize.OpenFile(tempFilePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法解析 Excel 文件"})
		return
	}
	defer f.Close()

	wrongQuestions, err := services.ParseWrongQuestionsFromExcel(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var validCount int
	var errors []string
	for i := range wrongQuestions {
		if err := services.ValidateWrongQuestionRow(&wrongQuestions[i]); err != nil {
			errors = append(errors, err.Error())
		} else {
			validCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "预览成功",
		"total_rows":    len(wrongQuestions),
		"valid_count":   validCount,
		"invalid_count": len(errors),
		"errors":        errors,
		"preview_data":  wrongQuestions[:minInt(10, len(wrongQuestions))],
	})
}

// ExecuteWrongQuestionsImport 执行错题导入
func (ic *ImportController) ExecuteWrongQuestionsImport(c *gin.Context) {
	userIDInterface, _ := c.Get("user_id")
	userID := userIDInterface.(string)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未上传文件"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持 .xlsx 或 .xls 文件"})
		return
	}

	tempFilePath := filepath.Join("storage/temp", uuid.New().String()+ext)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	f, err := excelize.OpenFile(tempFilePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法解析 Excel 文件"})
		return
	}
	defer f.Close()

	wrongQuestions, err := services.ParseWrongQuestionsFromExcel(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := services.ImportWrongQuestionsToDatabase(database.DB, userID, wrongQuestions)

	c.JSON(http.StatusOK, gin.H{
		"message": "导入完成",
		"result":  result,
	})
}

// DownloadQuestionTemplate 下载题目导入模板
func (ic *ImportController) DownloadQuestionTemplate(c *gin.Context) {
	f, err := services.GenerateQuestionTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成模板失败"})
		return
	}
	defer f.Close()

	// 设置响应头
	filename := fmt.Sprintf("question_import_template_%s.xlsx", time.Now().Format("20060102"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	// 写入响应
	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "下载失败"})
		return
	}
}

// DownloadWrongQuestionTemplate 下载错题导入模板
func (ic *ImportController) DownloadWrongQuestionTemplate(c *gin.Context) {
	f, err := services.GenerateWrongQuestionTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成模板失败"})
		return
	}
	defer f.Close()

	filename := fmt.Sprintf("wrong_question_import_template_%s.xlsx", time.Now().Format("20060102"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "下载失败"})
		return
	}
}

// BatchUploadAudio 批量上传音频文件
func (ic *ImportController) BatchUploadAudio(c *gin.Context) {
	userIDInterface, _ := c.Get("user_id")
	userID := userIDInterface.(string)

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "解析表单失败"})
		return
	}

	files := form.File["audio_files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有上传文件"})
		return
	}

	var results []map[string]interface{}
	uploadedMap := make(map[string]string) // filename -> URL 映射

	for _, file := range files {
		// 检查文件类型
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext != ".mp3" && ext != ".wav" && ext != ".ogg" {
			results = append(results, map[string]interface{}{
				"filename": file.Filename,
				"success":  false,
				"error":    "不支持的音频格式",
			})
			continue
		}

		// 生成唯一文件名
		filename := fmt.Sprintf("%s_%s%s", userID, uuid.New().String(), ext)
		savePath := filepath.Join("storage/audio", filename)

		// 保存文件
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			results = append(results, map[string]interface{}{
				"filename": file.Filename,
				"success":  false,
				"error":    "保存文件失败",
			})
			continue
		}

		// 生成访问 URL
		audioURL := fmt.Sprintf("/storage/audio/%s", filename)

		results = append(results, map[string]interface{}{
			"filename":     file.Filename,
			"success":      true,
			"url":          audioURL,
			"saved_as":     filename,
		})

		uploadedMap[file.Filename] = audioURL
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "批量上传完成",
		"total":        len(files),
		"success_count": countSuccess(results),
		"results":      results,
		"audio_map":    uploadedMap,
	})
}

// 辅助函数
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func countSuccess(results []map[string]interface{}) int {
	count := 0
	for _, r := range results {
		if success, ok := r["success"].(bool); ok && success {
			count++
		}
	}
	return count
}
