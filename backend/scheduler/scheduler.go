package scheduler

import (
	"time"

	"github.com/go-co-op/gocron/v2"
	"go.uber.org/zap"
	"pte-memory-backend/logger"
)

var (
	Scheduler gocron.Scheduler
)

// Init initializes the scheduler
func Init() error {
	var err error
	Scheduler, err = gocron.NewScheduler()
	if err != nil {
		logger.Error("Failed to create scheduler", zap.Error(err))
		return err
	}

	logger.Info("Scheduler initialized successfully")
	return nil
}

// Start starts the scheduler
func Start() {
	if Scheduler != nil {
		Scheduler.Start()
		logger.Info("Scheduler started")
	}
}

// Stop stops the scheduler
func Stop() error {
	if Scheduler != nil {
		if err := Scheduler.Shutdown(); err != nil {
			logger.Error("Failed to shutdown scheduler", zap.Error(err))
			return err
		}
		logger.Info("Scheduler stopped")
	}
	return nil
}

// RegisterJobs registers all scheduled jobs
func RegisterJobs() error {
	logger.Info("Registering scheduled jobs...")

	// Example: Clean up expired data every day at 2 AM
	_, err := Scheduler.NewJob(
		gocron.DailyJob(1, gocron.NewAtTimes(
			gocron.NewAtTime(2, 0, 0),
		)),
		gocron.NewTask(CleanupExpiredDataJob),
		gocron.WithName("cleanup_expired_data"),
	)
	if err != nil {
		logger.Error("Failed to register cleanup job", zap.Error(err))
		return err
	}

	// Send review reminders every hour
	_, err = Scheduler.NewJob(
		gocron.DurationJob(1*time.Hour),
		gocron.NewTask(SendReviewRemindersJob),
		gocron.WithName("send_review_reminders"),
	)
	if err != nil {
		logger.Error("Failed to register review reminder job", zap.Error(err))
		return err
	}

	// Generate daily reports at midnight
	_, err = Scheduler.NewJob(
		gocron.DailyJob(1, gocron.NewAtTimes(
			gocron.NewAtTime(0, 0, 0),
		)),
		gocron.NewTask(GenerateDailyReportsJob),
		gocron.WithName("generate_daily_reports"),
	)
	if err != nil {
		logger.Error("Failed to register daily report job", zap.Error(err))
		return err
	}

	// Update user streaks every day at 1 AM
	_, err = Scheduler.NewJob(
		gocron.DailyJob(1, gocron.NewAtTimes(
			gocron.NewAtTime(1, 0, 0),
		)),
		gocron.NewTask(UpdateUserStreaksJob),
		gocron.WithName("update_user_streaks"),
	)
	if err != nil {
		logger.Error("Failed to register streak update job", zap.Error(err))
		return err
	}

	// Clean up old notifications every week
	_, err = Scheduler.NewJob(
		gocron.WeeklyJob(1, gocron.NewWeekdays(time.Sunday),
			gocron.NewAtTimes(gocron.NewAtTime(3, 0, 0)),
		),
		gocron.NewTask(CleanupOldNotificationsJob),
		gocron.WithName("cleanup_old_notifications"),
	)
	if err != nil {
		logger.Error("Failed to register notification cleanup job", zap.Error(err))
		return err
	}

	// Refresh cache every 30 minutes
	_, err = Scheduler.NewJob(
		gocron.DurationJob(30*time.Minute),
		gocron.NewTask(RefreshCacheJob),
		gocron.WithName("refresh_cache"),
	)
	if err != nil {
		logger.Error("Failed to register cache refresh job", zap.Error(err))
		return err
	}

	// Generate daily review plans at midnight
	_, err = Scheduler.NewJob(
		gocron.DailyJob(1, gocron.NewAtTimes(
			gocron.NewAtTime(0, 0, 0),
		)),
		gocron.NewTask(GenerateDailyReviewPlansJob),
		gocron.WithName("generate_daily_review_plans"),
	)
	if err != nil {
		logger.Error("Failed to register daily review plans job", zap.Error(err))
		return err
	}

	// Check and send reminders every hour (integrated with reminder_service)
	_, err = Scheduler.NewJob(
		gocron.DurationJob(1*time.Hour),
		gocron.NewTask(CheckAndSendRemindersJob),
		gocron.WithName("check_and_send_reminders"),
	)
	if err != nil {
		logger.Error("Failed to register reminders check job", zap.Error(err))
		return err
	}

	logger.Info("All scheduled jobs registered successfully")
	return nil
}
