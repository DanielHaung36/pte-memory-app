@echo off
echo Starting PTE Memory Backend...

echo.
echo Setting CGO environment...
set CGO_ENABLED=1

echo.
echo Running with SQLite fallback support...
go run main.go

pause