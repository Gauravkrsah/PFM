# 🚀 cPanel Deployment Guide for Personal Finance Manager

## 📋 Prerequisites
- cPanel hosting account with Python support
- Domain/subdomain configured
- SSH access (optional but recommended)

## 🎯 Step-by-Step Deployment

### 1️⃣ **Prepare Frontend Build**

```bash
# In your local pfm directory
npm run build
```

### 2️⃣ **Upload Frontend Files**

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to public_html** (or your domain folder)
4. **Upload the entire `build` folder contents**
   - Upload `build/static/` folder
   - Upload `build/index.html`
   - Upload `build/manifest.json`
   - Upload `build/favicon.ico`

### 3️⃣ **Setup Python Backend**

1. **In cPanel, go to "Python App"**
2. **Create New App:**
   - Python Version: 3.8+ 
   - App Directory: `api` (or `backend`)
   - App URL: `/api`
   - Startup File: `app.py`
   - Application Entry Point: `application`

3. **Upload Backend Files:**
   - Upload entire `backend/` folder to the app directory
   - Ensure `app.py` is in the root of app directory

### 4️⃣ **Install Dependencies**

In cPanel Python App terminal or SSH:
```bash
pip install fastapi uvicorn python-multipart google-generativeai python-dotenv websockets
```

### 5️⃣ **Configure Environment**

1. **Create `.env` file in backend directory:**
```
REACT_APP_SUPABASE_URL=https://qbcczhvrmlmorzszdkmm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiY2N6aHZybWxtb3J6c3pka21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTQxNTEsImV4cCI6MjA2OTE3MDE1MX0.ugK8RtY3GlKKNuy0im1h8DWLCOzdv95HMDcv-RVDLlI
GEMINI_API_KEY=AIzaSyAj0IlBxZUnskZLEvmzZUQQLObMRqGiJjE
```

2. **Update `public_html/config.js`:**
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'https://yourdomain.com/api'
}
```

### 6️⃣ **File Structure on Server**

```
public_html/
├── index.html (from build)
├── static/ (from build)
├── config.js
└── api/ (Python app directory)
    ├── app.py
    ├── main.py
    ├── nlp_parser.py
    ├── requirements.txt
    └── .env
```

### 7️⃣ **Test Deployment**

1. **Visit your domain** - Frontend should load
2. **Test API** - Visit `yourdomain.com/api/health`
3. **Test functionality** - Try adding expenses and chat

## 🔧 **Troubleshooting**

### Common Issues:

1. **API not working:**
   - Check Python app is running in cPanel
   - Verify `config.js` has correct API URL
   - Check error logs in cPanel

2. **CORS errors:**
   - Ensure your domain is in CORS origins in `main.py`

3. **WebSocket issues:**
   - Some shared hosting doesn't support WebSockets
   - App will work without WebSocket features

### 🔍 **Quick Fixes:**

```python
# In main.py, update CORS origins:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## ✅ **Final Checklist**

- [ ] Frontend build uploaded to public_html
- [ ] Python app created and running
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] config.js updated with correct API URL
- [ ] CORS configured for your domain
- [ ] Test all features working

## 🎉 **Success!**

Your Personal Finance Manager should now be live at your domain!

**Features Available:**
- ✅ Expense tracking with natural language
- ✅ Group expense management  
- ✅ Real-time chat analysis
- ✅ Persistent data across sessions
- ✅ Analytics and insights