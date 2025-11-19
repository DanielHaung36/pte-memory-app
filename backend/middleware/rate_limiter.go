package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"pte-memory-backend/logger"
	"go.uber.org/zap"
)

// RateLimiter implements a simple in-memory rate limiter
type RateLimiter struct {
	visitors map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewRateLimiter creates a new rate limiter
// rps: requests per second allowed
// burst: maximum burst size
func NewRateLimiter(rps float64, burst int) *RateLimiter {
	limiter := &RateLimiter{
		visitors: make(map[string]*rate.Limiter),
		rate:     rate.Limit(rps),
		burst:    burst,
	}

	// Start cleanup goroutine
	go limiter.cleanup()

	return limiter
}

// getVisitor returns the rate limiter for the given IP address
func (rl *RateLimiter) getVisitor(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.visitors[ip]
	if !exists {
		limiter = rate.NewLimiter(rl.rate, rl.burst)
		rl.visitors[ip] = limiter
	}

	return limiter
}

// cleanup removes old entries from the visitors map
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		for ip, limiter := range rl.visitors {
			// Remove if no tokens have been consumed in the last minute
			if limiter.Tokens() == float64(rl.burst) {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// Middleware returns a gin middleware that implements rate limiting
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := rl.getVisitor(ip)

		if !limiter.Allow() {
			logger.Warn("Rate limit exceeded",
				zap.String("ip", ip),
				zap.String("path", c.Request.URL.Path),
				zap.String("method", c.Request.Method),
			)

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests, please try again later",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GlobalRateLimiter creates a global rate limiter middleware
// Default: 100 requests per second with burst of 200
func GlobalRateLimiter() gin.HandlerFunc {
	limiter := NewRateLimiter(100, 200)
	return limiter.Middleware()
}

// StrictRateLimiter creates a strict rate limiter for sensitive endpoints
// Default: 10 requests per second with burst of 20
func StrictRateLimiter() gin.HandlerFunc {
	limiter := NewRateLimiter(10, 20)
	return limiter.Middleware()
}

// AuthRateLimiter creates a rate limiter for authentication endpoints
// Default: 5 requests per second with burst of 10 (prevents brute force)
func AuthRateLimiter() gin.HandlerFunc {
	limiter := NewRateLimiter(5, 10)
	return limiter.Middleware()
}

// Per-User Rate Limiter
type UserRateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewUserRateLimiter creates a per-user rate limiter
func NewUserRateLimiter(rps float64, burst int) *UserRateLimiter {
	limiter := &UserRateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     rate.Limit(rps),
		burst:    burst,
	}

	go limiter.cleanup()

	return limiter
}

func (url *UserRateLimiter) getLimiter(userID string) *rate.Limiter {
	url.mu.Lock()
	defer url.mu.Unlock()

	limiter, exists := url.limiters[userID]
	if !exists {
		limiter = rate.NewLimiter(url.rate, url.burst)
		url.limiters[userID] = limiter
	}

	return limiter
}

func (url *UserRateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		url.mu.Lock()
		for userID, limiter := range url.limiters {
			if limiter.Tokens() == float64(url.burst) {
				delete(url.limiters, userID)
			}
		}
		url.mu.Unlock()
	}
}

// Middleware returns a gin middleware for per-user rate limiting
// Must be used after AuthMiddleware
func (url *UserRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			// If no user_id, fall back to IP-based limiting
			c.Next()
			return
		}

		limiter := url.getLimiter(userID.(string))
		if !limiter.Allow() {
			logger.Warn("User rate limit exceeded",
				zap.String("user_id", userID.(string)),
				zap.String("path", c.Request.URL.Path),
			)

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests, please slow down",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// PerUserRateLimiter creates a per-user rate limiter
// Default: 50 requests per second per user
func PerUserRateLimiter() gin.HandlerFunc {
	limiter := NewUserRateLimiter(50, 100)
	return limiter.Middleware()
}
