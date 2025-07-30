@echo off
echo Starting Personal Finance Manager...
echo.

echo Starting backend server...
start "PFM Backend" cmd /k "cd backend && python main.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend...
start "PFM Frontend" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul