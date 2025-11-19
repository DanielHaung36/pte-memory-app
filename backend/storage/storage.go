package storage

import (
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"pte-memory-backend/logger"
)

// StorageProvider defines the interface for file storage
type StorageProvider interface {
	Upload(file *multipart.FileHeader, folder string) (string, error)
	Delete(fileURL string) error
	GetURL(filePath string) string
}

// LocalStorage implements local file storage
type LocalStorage struct {
	BasePath string
	BaseURL  string
}

// NewLocalStorage creates a new local storage provider
func NewLocalStorage(basePath, baseURL string) *LocalStorage {
	return &LocalStorage{
		BasePath: basePath,
		BaseURL:  baseURL,
	}
}

// Upload uploads a file to local storage
func (ls *LocalStorage) Upload(file *multipart.FileHeader, folder string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext

	// Create folder if it doesn't exist
	folderPath := filepath.Join(ls.BasePath, folder)
	if err := os.MkdirAll(folderPath, 0755); err != nil {
		logger.Error("Failed to create upload folder", zap.Error(err))
		return "", err
	}

	// Full file path
	filePath := filepath.Join(folderPath, filename)

	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		logger.Error("Failed to open uploaded file", zap.Error(err))
		return "", err
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		logger.Error("Failed to create destination file", zap.Error(err))
		return "", err
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, src); err != nil {
		logger.Error("Failed to copy file content", zap.Error(err))
		return "", err
	}

	// Return relative path for URL
	relativePath := filepath.Join(folder, filename)
	logger.Info("File uploaded successfully",
		zap.String("filename", filename),
		zap.String("folder", folder),
	)

	return relativePath, nil
}

// Delete deletes a file from local storage
func (ls *LocalStorage) Delete(fileURL string) error {
	filePath := filepath.Join(ls.BasePath, fileURL)
	if err := os.Remove(filePath); err != nil {
		logger.Error("Failed to delete file", zap.String("path", filePath), zap.Error(err))
		return err
	}

	logger.Info("File deleted successfully", zap.String("path", fileURL))
	return nil
}

// GetURL returns the full URL for a file
func (ls *LocalStorage) GetURL(filePath string) string {
	return ls.BaseURL + "/" + filePath
}

// S3Storage implements AWS S3 storage (placeholder for future implementation)
type S3Storage struct {
	Bucket    string
	Region    string
	AccessKey string
	SecretKey string
}

// NewS3Storage creates a new S3 storage provider
func NewS3Storage(bucket, region, accessKey, secretKey string) *S3Storage {
	return &S3Storage{
		Bucket:    bucket,
		Region:    region,
		AccessKey: accessKey,
		SecretKey: secretKey,
	}
}

// Upload uploads a file to S3 (TODO: implement with AWS SDK)
func (s3 *S3Storage) Upload(file *multipart.FileHeader, folder string) (string, error) {
	logger.Warn("S3 upload not implemented yet, falling back to local storage")
	return "", errors.New("S3 upload not implemented")
}

// Delete deletes a file from S3 (TODO: implement with AWS SDK)
func (s3 *S3Storage) Delete(fileURL string) error {
	logger.Warn("S3 delete not implemented yet")
	return errors.New("S3 delete not implemented")
}

// GetURL returns the full URL for a file in S3
func (s3 *S3Storage) GetURL(filePath string) string {
	return "https://" + s3.Bucket + ".s3." + s3.Region + ".amazonaws.com/" + filePath
}

// Global storage provider
var Storage StorageProvider

// Init initializes the storage provider
func Init(provider string, config map[string]string) {
	switch provider {
	case "s3":
		Storage = NewS3Storage(
			config["bucket"],
			config["region"],
			config["access_key"],
			config["secret_key"],
		)
		logger.Info("S3 storage initialized (not yet implemented)")
	default:
		// Default to local storage
		basePath := config["base_path"]
		if basePath == "" {
			basePath = "./uploads"
		}
		baseURL := config["base_url"]
		if baseURL == "" {
			baseURL = "http://localhost:8080/uploads"
		}
		Storage = NewLocalStorage(basePath, baseURL)
		logger.Info("Local storage initialized",
			zap.String("base_path", basePath),
			zap.String("base_url", baseURL),
		)
	}
}

// ValidateFile validates file type and size
func ValidateFile(file *multipart.FileHeader, allowedTypes []string, maxSize int64) error {
	// Check file size
	if file.Size > maxSize {
		return errors.New("file size exceeds maximum allowed")
	}

	// Check file type
	ext := filepath.Ext(file.Filename)
	if len(allowedTypes) > 0 {
		allowed := false
		for _, allowedType := range allowedTypes {
			if ext == allowedType {
				allowed = true
				break
			}
		}
		if !allowed {
			return errors.New("file type not allowed")
		}
	}

	return nil
}

// Common file type constants
var (
	ImageTypes = []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	AudioTypes = []string{".mp3", ".wav", ".ogg", ".m4a"}
	VideoTypes = []string{".mp4", ".webm", ".mov"}
	DocTypes   = []string{".pdf", ".doc", ".docx", ".txt"}
)

// Common size limits (in bytes)
const (
	MaxImageSize = 5 * 1024 * 1024   // 5MB
	MaxAudioSize = 10 * 1024 * 1024  // 10MB
	MaxVideoSize = 50 * 1024 * 1024  // 50MB
	MaxDocSize   = 10 * 1024 * 1024  // 10MB
)

// GeneratePreSignedURL generates a pre-signed URL for temporary access
// This is useful for S3 or other cloud storage
func GeneratePreSignedURL(fileURL string, expiresIn time.Duration) (string, error) {
	// TODO: Implement pre-signed URL generation for S3
	logger.Warn("Pre-signed URL generation not implemented yet")
	return fileURL, nil
}
