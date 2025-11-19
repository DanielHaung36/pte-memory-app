@echo off
echo Setting up PostgreSQL database for PTE Memory App...

echo.
echo Creating database...
psql -U postgres -h localhost -c "CREATE DATABASE pte_memory_db;"

echo.
echo Setting up extensions...
psql -U postgres -h localhost -d pte_memory_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -h localhost -d pte_memory_db -c "CREATE EXTENSION IF NOT EXISTS \"intarray\";"

echo.
echo Database setup completed!
echo You can now run the backend with: go run main.go

pause