@echo off
echo 🚀 Building Personal Finance Manager for deployment...
echo.

echo 📦 Installing dependencies...
npm install

echo 🔨 Building production frontend...
npm run build

echo 📁 Creating deployment package...
if exist deploy rmdir /s /q deploy
mkdir deploy
mkdir deploy\frontend
mkdir deploy\backend

echo 📋 Copying frontend build files...
xcopy build\* deploy\frontend\ /E /I /Y
copy public\config.js deploy\frontend\ /Y

echo 📋 Copying backend files...
copy backend\*.py deploy\backend\ /Y
copy backend\requirements.txt deploy\backend\ /Y
copy .env.production deploy\backend\.env /Y

echo ✅ Deployment package ready in 'deploy' folder!
echo.
echo 📝 Next steps:
echo 1. Upload 'deploy/frontend' contents to your public_html folder
echo 2. Upload 'deploy/backend' contents to your Python app directory
echo 3. Update config.js with your domain
echo 4. Install Python dependencies in cPanel
echo.
pause