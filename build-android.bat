@echo off
echo Building PFM Android App...

echo.
echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Building React app...
call npm run build

echo.
echo Step 3: Syncing with Capacitor...
call npx cap sync android

echo.
echo Step 4: Opening Android Studio...
call npx cap open android

echo.
echo Android project is now ready in Android Studio!
pause