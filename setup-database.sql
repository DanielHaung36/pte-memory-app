-- PTE Memory App Database Setup Script
-- Run this script in your PostgreSQL database

-- Create database (run this as postgres superuser)
-- CREATE DATABASE pte_memory_db;

-- Connect to the database and enable required extensions
\c pte_memory_db;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostgreSQL array functions
CREATE EXTENSION IF NOT EXISTS "intarray";

-- Create indexes for better performance (will be created automatically by GORM)
-- These are documented here for reference

-- Users table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Questions table indexes  
-- CREATE INDEX IF NOT EXISTS idx_questions_user_type ON questions (user_id, question_type);
-- CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions (created_at DESC);

-- Review schedules indexes
-- CREATE INDEX IF NOT EXISTS idx_review_schedules_next_review ON review_schedules (next_review_date);
-- CREATE INDEX IF NOT EXISTS idx_review_schedules_user_priority ON review_schedules (user_id, priority DESC);

-- Review sessions indexes
-- CREATE INDEX IF NOT EXISTS idx_review_sessions_user_date ON review_sessions (user_id, reviewed_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_review_sessions_session_id ON review_sessions (session_id);

-- Daily goals indexes
-- CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals (user_id, date DESC);

COMMIT;