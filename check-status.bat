@echo off
echo ========================================
echo Maruthuvan - System Check
echo ========================================
echo.

echo [1/4] Checking MongoDB...
sc query MongoDB | findstr "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is NOT running
    echo    Fix: net start MongoDB
)
echo.

echo [2/4] Checking Backend (Port 5000)...
curl -s http://localhost:5000/api/health-check >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running on port 5000
) else (
    echo ❌ Backend is NOT running
    echo    Fix: cd backend ^&^& node server.js
)
echo.

echo [3/4] Checking Frontend (Port 3000)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on port 3000
) else (
    echo ❌ Frontend is NOT running
    echo    Fix: cd frontend ^&^& npm run dev
)
echo.

echo [4/4] Testing OTP Endpoint...
curl -s -X POST http://localhost:5000/api/auth/send-otp -H "Content-Type: application/json" -d "{\"mobile\":\"9876543210\",\"language\":\"ta\"}" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ OTP endpoint is working
) else (
    echo ❌ OTP endpoint failed
)
echo.

echo ========================================
echo.
pause
