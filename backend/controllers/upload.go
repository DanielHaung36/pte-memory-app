package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"pte-memory-backend/logger"
	"pte-memory-backend/middleware"
	"pte-memory-backend/storage"
)

type UploadController struct{}

// UploadAvatar uploads user avatar
// POST /api/upload/avatar
func (uc *UploadController) UploadAvatar(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get file from request
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Validate file
	if err := storage.ValidateFile(file, storage.ImageTypes, storage.MaxImageSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upload file
	filePath, err := storage.Storage.Upload(file, "avatars")
	if err != nil {
		logger.Error("Failed to upload avatar",
			zap.String("user_id", user.ID),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	// Get full URL
	fileURL := storage.Storage.GetURL(filePath)

	// TODO: Update user avatar in database
	// user.Avatar = fileURL
	// database.DB.Save(&user)

	logger.Info("Avatar uploaded successfully",
		zap.String("user_id", user.ID),
		zap.String("file_url", fileURL),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Avatar uploaded successfully",
		"url":     fileURL,
	})
}

// UploadQuestionAudio uploads audio file for a question
// POST /api/upload/audio
func (uc *UploadController) UploadQuestionAudio(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get file from request
	file, err := c.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Validate file
	if err := storage.ValidateFile(file, storage.AudioTypes, storage.MaxAudioSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upload file
	filePath, err := storage.Storage.Upload(file, "audio")
	if err != nil {
		logger.Error("Failed to upload audio",
			zap.String("user_id", user.ID),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	// Get full URL
	fileURL := storage.Storage.GetURL(filePath)

	logger.Info("Audio uploaded successfully",
		zap.String("user_id", user.ID),
		zap.String("file_url", fileURL),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Audio uploaded successfully",
		"url":     fileURL,
	})
}

// UploadQuestionImage uploads image file for a question
// POST /api/upload/image
func (uc *UploadController) UploadQuestionImage(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Get file from request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	// Validate file
	if err := storage.ValidateFile(file, storage.ImageTypes, storage.MaxImageSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upload file
	filePath, err := storage.Storage.Upload(file, "images")
	if err != nil {
		logger.Error("Failed to upload image",
			zap.String("user_id", user.ID),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	// Get full URL
	fileURL := storage.Storage.GetURL(filePath)

	logger.Info("Image uploaded successfully",
		zap.String("user_id", user.ID),
		zap.String("file_url", fileURL),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Image uploaded successfully",
		"url":     fileURL,
	})
}

// DeleteFile deletes an uploaded file
// DELETE /api/upload/:fileId
func (uc *UploadController) DeleteFile(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	fileURL := c.Param("fileId")
	if fileURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID required"})
		return
	}

	// TODO: Verify user owns this file before deleting

	if err := storage.Storage.Delete(fileURL); err != nil {
		logger.Error("Failed to delete file",
			zap.String("user_id", user.ID),
			zap.String("file_url", fileURL),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	logger.Info("File deleted successfully",
		zap.String("user_id", user.ID),
		zap.String("file_url", fileURL),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
	})
}
