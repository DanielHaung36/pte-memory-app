package controllers

import (
	"net/http"
	"strings"
	"time"
	
	"github.com/gin-gonic/gin"
	"pte-memory-backend/database"
	"pte-memory-backend/middleware"
	"pte-memory-backend/models"
)

type AuthController struct{}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register creates a new user account
func (ac *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": err.Error(),
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "User already exists",
			"message": "A user with this email or username already exists",
		})
		return
	}

	// Create new user
	user := models.User{
		Username: strings.TrimSpace(req.Username),
		Email:    strings.TrimSpace(strings.ToLower(req.Email)),
	}

	// Hash password
	if err := user.HashPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process password",
			"message": "Internal server error",
		})
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	
	// Create user
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create user",
			"message": "Internal server error",
		})
		return
	}

	// Create user stats
	userStats := models.UserStats{
		UserID:    user.ID,
		DailyGoal: 20,
	}
	if err := tx.Create(&userStats).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create user stats",
			"message": "Internal server error",
		})
		return
	}

	tx.Commit()

	// Generate JWT token
	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate token",
			"message": "Internal server error",
		})
		return
	}

	// Set HTTP-only cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"auth_token",           // name
		token,                  // value
		int((7*24*time.Hour).Seconds()), // maxAge (7 days)
		"/",                    // path
		"",                     // domain
		false,                  // secure (set to true in production with HTTPS)
		true,                   // httpOnly
	)

	// Return success response (without token)
	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user,
	})
}

// Login authenticates a user and returns a JWT token
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": err.Error(),
		})
		return
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email = ?", strings.TrimSpace(strings.ToLower(req.Email))).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Invalid credentials",
			"message": "Email or password is incorrect",
		})
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Invalid credentials",
			"message": "Email or password is incorrect",
		})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate token",
			"message": "Internal server error",
		})
		return
	}

	// Set HTTP-only cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"auth_token",           // name
		token,                  // value
		int((7*24*time.Hour).Seconds()), // maxAge (7 days)
		"/",                    // path
		"",                     // domain
		false,                  // secure (set to true in production with HTTPS)
		true,                   // httpOnly
	)

	// Return success response (without token)
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
	})
}

// GetMe returns current user information
func (ac *AuthController) GetMe(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "User not found",
			"message": "Authentication required",
		})
		return
	}

	// Load user with stats
	var userWithStats models.User
	database.DB.Preload("UserStats").First(&userWithStats, "id = ?", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user": userWithStats,
	})
}

// UpdateProfile updates user profile information
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	user, exists := middleware.GetUserFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "User not found",
			"message": "Authentication required",
		})
		return
	}

	var req struct {
		Username string `json:"username"`
		Avatar   string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": err.Error(),
		})
		return
	}

	// Update user
	if req.Username != "" {
		user.Username = strings.TrimSpace(req.Username)
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := database.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update profile",
			"message": "Internal server error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

// Logout clears the authentication cookie
func (ac *AuthController) Logout(c *gin.Context) {
	// Clear the authentication cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"auth_token",           // name
		"",                     // value (empty)
		-1,                     // maxAge (-1 means delete immediately)
		"/",                    // path
		"",                     // domain
		false,                  // secure
		true,                   // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}