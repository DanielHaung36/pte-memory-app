@echo off
echo Starting PTE Memory App Development Environment...

echo.
echo ========================================
echo 1. Starting PostgreSQL with Docker...
echo ========================================
docker-compose up -d postgres

echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo 2. Starting Backend Server...
echo ========================================
cd backend
start "Backend" cmd /k "go run main.go"

echo.
echo ========================================
echo 3. Starting Frontend Server...
echo ========================================
cd ..\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Development Environment Started!
echo ========================================
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping services...
docker-compose down
taskkill /f /im "go.exe" 2>nul
taskkill /f /im "node.exe" 2>nul

echo All services stopped.
pause