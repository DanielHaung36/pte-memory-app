# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start (Windows)
```bash
# Backend - Run from project root
start-backend.bat

# Frontend - Run from project root  
start-frontend.bat

# API Testing
test-api.bat
```

### Manual Development Commands
```bash
# Backend
cd backend
go mod tidy
go run main.go                    # Starts on port 8080

# Frontend
cd frontend
npm install --legacy-peer-deps   # Use legacy peer deps flag
npm run dev                      # Starts on port 3000+
npm run build                    # Production build
npm run lint                     # ESLint checking

# Testing
curl http://localhost:8080/health # Backend health check
```

## High-Level Architecture

### Technology Stack
- **Backend**: Go 1.21 with Gin framework, GORM, PostgreSQL, JWT authentication
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query, Framer Motion
- **Database**: PostgreSQL with spaced repetition algorithm tables
- **Real-time**: Socket.io for live features

### Core System Components

#### Backend Architecture (`backend/`)
```
main.go                  # Entry point with CORS config and routing
config/                  # Environment configuration
database/                # PostgreSQL connection and migrations  
models/                  # GORM data models
├── user.go             # User model with levels/XP/streaks
├── question.go         # Question model with types/difficulty
└── review.go           # Review schedule and session models
controllers/            # HTTP handlers
├── auth.go            # Registration/login endpoints
└── question.go        # CRUD and review endpoints  
services/
└── ebbinghaus.go      # SM-2 spaced repetition algorithm
routes/                # Route configuration
middleware/            # JWT auth middleware
```

#### Frontend Architecture (`frontend/`)
```
app/                    # Next.js 14 App Router
├── auth/              # Login/register pages
├── dashboard/         # Main dashboard with stats
├── questions/         # Question management
├── review/            # Review session interface
└── games/             # Word matching game
components/            # Reusable React components
├── AudioPlayer.tsx    # Web Audio API player
├── StreakCounter.tsx  # Gamification UI
└── WordMatchGame.tsx  # Interactive matching game
contexts/              # React Context providers
lib/                   # Utility functions and API clients
```

### Key Business Logic

#### Spaced Repetition System
The core learning algorithm is implemented in `backend/services/ebbinghaus.go`:
- Uses SM-2 algorithm with custom enhancements
- Calculates review intervals: 1 day → 2 days → 4 days → exponential growth
- Adjusts ease factor (1.3-2.5) based on performance
- Includes streak multipliers and confidence level adjustments
- Priority queue system for due reviews

#### Data Flow
1. **Question Creation**: Users create questions with audio, difficulty, tags
2. **Review Scheduling**: Algorithm creates initial review schedule
3. **Review Session**: Present due questions with timer/audio
4. **Performance Update**: Update intervals based on correctness/confidence
5. **Streak Tracking**: Continuous success tracking with level progression

### Database Schema
Core tables with relationships:
- `users` (id, username, email, level, xp, streak_count)
- `questions` (id, user_id, content, audio_url, question_type, difficulty)
- `review_schedules` (id, question_id, ease_factor, current_interval, next_review_date)
- `review_sessions` (id, user_id, question_id, is_correct, confidence_level)

### Configuration Notes
- **CORS**: Backend supports multiple frontend origins (3000,3001,3002)
- **Environment**: Backend uses `.env` file for database/JWT config
- **Dependencies**: Frontend requires `--legacy-peer-deps` flag for compatibility
- **Database**: PostgreSQL connection required before backend startup

### Gamification Features
- **Levels**: 5-tier progression system (Beginner → Legendary Master)
- **Streaks**: Consecutive correct answers with visual effects
- **XP System**: Experience points for correct answers and achievements
- **Audio Integration**: TTS and audio file playback support
- **Games**: Word matching with timing and scoring

### Testing & Health Checks
- Backend health endpoint: `GET /health`
- API testing script validates CORS, auth endpoints
- Frontend supports hot reloading in development
- Use browser dev tools for React Query DevTools