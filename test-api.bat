@echo off
echo =================================
echo  Testing PTE Memory App API
echo =================================
echo.

echo Testing backend health check...
curl -X GET http://localhost:8080/health
echo.
echo.

echo Testing CORS headers...
curl -X OPTIONS http://localhost:8080/api/auth/login -H "Origin: http://localhost:3002" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -v
echo.
echo.

echo Testing user registration endpoint...
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -H "Origin: http://localhost:3002" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"testpass123\"}" -v

echo.
echo.
echo Test completed!
pause