@echo off
echo 🚀 Starting Personal Finance Manager...
echo.

echo 🔪 Killing existing backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo ⏳ Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo 🔧 Starting backend server...
start "PFM Backend" cmd /k "cd backend && python main.py"

echo ⏳ Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo 🔍 Checking if backend is ready...
python check_backend.py
if %errorlevel% neq 0 (
    echo ⚠️ Backend not ready, waiting more...
    timeout /t 5 /nobreak >nul
)

echo 🌐 Starting frontend...
start "PFM Frontend" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo 📍 Backend: http://localhost:8000
echo 📍 Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul