@echo off
echo Building PTE Memory Backend with CGO enabled...

set CGO_ENABLED=1
set GOOS=windows
set GOARCH=amd64

echo.
echo Downloading dependencies...
go mod tidy

echo.
echo Building application...
go build -o pte-memory-backend.exe main.go

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Running application...
    echo.
    pte-memory-backend.exe
) else (
    echo.
    echo Build failed!
    pause
)