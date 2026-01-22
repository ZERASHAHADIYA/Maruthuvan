@echo off
echo ========================================
echo Maruthuvan Backend - Connection Test
echo ========================================
echo.

echo [1/3] Checking MongoDB Service...
sc query MongoDB | findstr "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB service is RUNNING
) else (
    echo ❌ MongoDB service is NOT running
    echo Starting MongoDB service...
    net start MongoDB
)
echo.

echo [2/3] Testing MongoDB Connection...
mongo --eval "db.version()" --quiet >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB connection successful
) else (
    echo ❌ MongoDB connection failed
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
)
echo.

echo [3/3] Starting Backend Server...
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js
