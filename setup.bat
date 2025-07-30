@echo off
echo Setting up Personal Finance Manager...
echo.

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..
npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Setup complete! 
echo.
echo To start the application:
echo 1. Start backend: cd backend && python main.py
echo 2. Start frontend: npm start
echo.
pause