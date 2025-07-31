# 🚀 Deploy Backend Permanently

## 🎯 **Permanent Solution for Mobile App**

Your mobile app needs a permanently accessible backend. Here are the best free options:

## **Option 1: Railway (Recommended)**

### **Step 1: Setup Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your GitHub account

### **Step 2: Deploy Backend**
1. **Push backend to GitHub:**
```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/yourusername/pfm-backend.git
git push -u origin main
```

2. **Deploy on Railway:**
   - Select your GitHub repo
   - Railway auto-detects Python
   - Add environment variable: `GEMINI_API_KEY=your_key`
   - Deploy automatically

3. **Get your URL:**
   - Railway gives you: `https://your-app.up.railway.app`

### **Step 3: Update Mobile App**
Update `src/components/Chat.jsx`:
```javascript
return 'https://your-app.up.railway.app' // Your Railway URL
```

## **Option 2: Render (Alternative)**

1. Go to [render.com](https://render.com)
2. Connect GitHub repo
3. Create "Web Service"
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## **Option 3: Heroku (Classic)**

```bash
# Install Heroku CLI
# Login: heroku login
cd backend
heroku create pfm-backend-app
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

## **Files Ready for Deployment:**
- ✅ `requirements.txt` - Dependencies
- ✅ `Procfile` - Start command
- ✅ `runtime.txt` - Python version
- ✅ CORS updated for mobile

## **After Deployment:**

1. **Test your deployed API:**
   - Visit: `https://your-deployed-url.com/health`
   - Should show: `{"status":"healthy"}`

2. **Update mobile app:**
   - Change URL in `Chat.jsx`
   - Rebuild: `npm run build && npx cap sync android`
   - Build APK in Android Studio

3. **Share APK:**
   - APK will work on any device
   - No need for local backend
   - Permanent solution! 🎉

## **Cost:**
- Railway: Free tier (500 hours/month)
- Render: Free tier (750 hours/month)  
- Heroku: Free tier discontinued, $5/month

**Recommended: Railway** - Easy setup, good free tier, reliable.