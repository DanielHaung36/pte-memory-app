package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"pte-memory-backend/logger"
)

var (
	Client *redis.Client
	ctx    = context.Background()
)

// Config holds Redis configuration
type Config struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// Init initializes the Redis client
func Init(config Config) error {
	Client = redis.NewClient(&redis.Options{
		Addr:     config.Host + ":" + config.Port,
		Password: config.Password,
		DB:       config.DB,
	})

	// Test connection
	if err := Client.Ping(ctx).Err(); err != nil {
		logger.Warn("Redis connection failed, running without cache", zap.Error(err))
		Client = nil
		return err
	}

	logger.Info("Redis cache connected successfully",
		zap.String("addr", config.Host+":"+config.Port),
	)

	return nil
}

// IsEnabled checks if Redis is available
func IsEnabled() bool {
	return Client != nil
}

// Set stores a value in Redis with expiration
func Set(key string, value interface{}, expiration time.Duration) error {
	if !IsEnabled() {
		return nil // Silently fail if Redis is not available
	}

	jsonData, err := json.Marshal(value)
	if err != nil {
		logger.Error("Failed to marshal cache data", zap.String("key", key), zap.Error(err))
		return err
	}

	if err := Client.Set(ctx, key, jsonData, expiration).Err(); err != nil {
		logger.Error("Failed to set cache", zap.String("key", key), zap.Error(err))
		return err
	}

	return nil
}

// Get retrieves a value from Redis
func Get(key string, dest interface{}) error {
	if !IsEnabled() {
		return redis.Nil // Return nil error to indicate cache miss
	}

	val, err := Client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			// Cache miss is not an error
			return err
		}
		logger.Error("Failed to get cache", zap.String("key", key), zap.Error(err))
		return err
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		logger.Error("Failed to unmarshal cache data", zap.String("key", key), zap.Error(err))
		return err
	}

	return nil
}

// Delete removes a key from Redis
func Delete(key string) error {
	if !IsEnabled() {
		return nil
	}

	if err := Client.Del(ctx, key).Err(); err != nil {
		logger.Error("Failed to delete cache", zap.String("key", key), zap.Error(err))
		return err
	}

	return nil
}

// DeletePattern deletes all keys matching a pattern
func DeletePattern(pattern string) error {
	if !IsEnabled() {
		return nil
	}

	iter := Client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := Client.Del(ctx, iter.Val()).Err(); err != nil {
			logger.Error("Failed to delete cache key", zap.String("key", iter.Val()), zap.Error(err))
		}
	}

	if err := iter.Err(); err != nil {
		logger.Error("Failed to scan cache keys", zap.String("pattern", pattern), zap.Error(err))
		return err
	}

	return nil
}

// Exists checks if a key exists in Redis
func Exists(key string) bool {
	if !IsEnabled() {
		return false
	}

	result, err := Client.Exists(ctx, key).Result()
	if err != nil {
		logger.Error("Failed to check cache existence", zap.String("key", key), zap.Error(err))
		return false
	}

	return result > 0
}

// Increment increments a counter in Redis
func Increment(key string, expiration time.Duration) (int64, error) {
	if !IsEnabled() {
		return 0, nil
	}

	val, err := Client.Incr(ctx, key).Result()
	if err != nil {
		logger.Error("Failed to increment cache", zap.String("key", key), zap.Error(err))
		return 0, err
	}

	// Set expiration if this is a new key
	if val == 1 && expiration > 0 {
		Client.Expire(ctx, key, expiration)
	}

	return val, nil
}

// SetNX sets a value only if the key does not exist (used for distributed locks)
func SetNX(key string, value interface{}, expiration time.Duration) (bool, error) {
	if !IsEnabled() {
		return false, nil
	}

	jsonData, err := json.Marshal(value)
	if err != nil {
		return false, err
	}

	result, err := Client.SetNX(ctx, key, jsonData, expiration).Result()
	if err != nil {
		logger.Error("Failed to set cache NX", zap.String("key", key), zap.Error(err))
		return false, err
	}

	return result, nil
}

// GetTTL gets the remaining time to live of a key
func GetTTL(key string) (time.Duration, error) {
	if !IsEnabled() {
		return 0, nil
	}

	ttl, err := Client.TTL(ctx, key).Result()
	if err != nil {
		logger.Error("Failed to get TTL", zap.String("key", key), zap.Error(err))
		return 0, err
	}

	return ttl, nil
}

// FlushAll removes all keys from Redis (use with caution!)
func FlushAll() error {
	if !IsEnabled() {
		return nil
	}

	if err := Client.FlushAll(ctx).Err(); err != nil {
		logger.Error("Failed to flush cache", zap.Error(err))
		return err
	}

	logger.Warn("All cache keys flushed")
	return nil
}

// Cache key generators
func UserCacheKey(userID string) string {
	return "user:" + userID
}

func QuestionCacheKey(questionID string) string {
	return "question:" + questionID
}

func UserQuestionsCacheKey(userID string) string {
	return "user_questions:" + userID
}

func DueQuestionsCacheKey(userID string) string {
	return "due_questions:" + userID
}

func UserStatsCacheKey(userID string) string {
	return "user_stats:" + userID
}

func ShopItemsCacheKey() string {
	return "shop_items"
}

func LeaderboardCacheKey() string {
	return "leaderboard"
}

// Common TTL values
const (
	TTLShort  = 5 * time.Minute   // For frequently changing data
	TTLMedium = 30 * time.Minute  // For moderately stable data
	TTLLong   = 2 * time.Hour     // For stable data
	TTLDay    = 24 * time.Hour    // For very stable data
)
