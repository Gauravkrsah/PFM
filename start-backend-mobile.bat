@echo off
echo Starting PFM Backend Server for Mobile...
echo Backend will be accessible at:
echo - Web: http://localhost:8000
echo - Mobile: http://192.168.1.81:8000
echo.
cd backend
python main.py
pause