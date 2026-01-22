@echo off
echo ========================================
echo Starting Maruthuvan Application
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Maruthuvan Backend" cmd /k "cd /d c:\Users\HP\OneDrive\Documents\MARUTHUVAN\backend && node server.js"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Port 3000)...
start "Maruthuvan Frontend" cmd /k "cd /d c:\Users\HP\OneDrive\Documents\MARUTHUVAN\frontend && npm run dev"

echo.
echo ========================================
echo ✅ Application Started!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
