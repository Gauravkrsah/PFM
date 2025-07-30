@echo off
echo Stopping PFM Backend processes...

REM Kill processes using port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Killing process %%a on port 8000...
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any python processes running main.py
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq python.exe" /FO CSV ^| findstr main.py') do (
    echo Killing Python process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo Backend processes stopped.
timeout /t 1 /nobreak >nul