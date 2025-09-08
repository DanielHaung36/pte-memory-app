@echo off
echo =================================
echo  PTE Memory App Frontend Server
echo =================================
echo.
echo Installing dependencies...
cd frontend
npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)

echo Dependencies installed successfully
echo.
echo Starting development server...
echo Server will start on available port (3000, 3001, 3002...)
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause