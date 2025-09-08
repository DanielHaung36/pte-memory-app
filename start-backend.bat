@echo off
echo =================================
echo  PTE Memory App Backend Server
echo =================================
echo.
echo Checking dependencies...
cd backend
go mod tidy
if errorlevel 1 (
    echo ERROR: Failed to update Go dependencies
    pause
    exit /b 1
)

echo Dependencies updated successfully
echo.
echo Starting server on http://localhost:8080...
echo Press Ctrl+C to stop the server
echo.

go run main.go

if errorlevel 1 (
    echo ERROR: Server failed to start
    echo Please check:
    echo - PostgreSQL is running
    echo - Database 'pte_memory_db' exists
    echo - Connection settings in .env file
    pause
    exit /b 1
)

pause