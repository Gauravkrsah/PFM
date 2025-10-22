# 🚀 Quick Share Instructions

## Step-by-Step (4 Terminals)

### Terminal 1: Start Backend
```bash
cd backend
python main.py
```
✅ Backend running on port 8000

### Terminal 2: Expose Backend with Ngrok
```bash
ngrok http 8000
```
📋 **COPY the https URL** (e.g., `https://abc123.ngrok-free.app`)

### Terminal 3: Update Config & Start Frontend
1. Open `public/config.js`
2. Replace the API_BASE_URL with your ngrok backend URL:
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'https://abc123.ngrok-free.app',  // ← YOUR NGROK BACKEND URL
  ENVIRONMENT: 'production'
};
```
3. Start frontend:
```bash
npm start
```
✅ Frontend running on port 3000

### Terminal 4: Expose Frontend with Ngrok
```bash
ngrok http 3000
```
🎉 **SHARE this URL** with others!

## Important Notes
- ⚠️ You MUST update `public/config.js` with your backend ngrok URL
- ⚠️ Do this BEFORE starting the frontend
- ⚠️ If frontend is already running, just refresh the browser after updating config.js
- ✅ No need to rebuild or restart after changing config.js

## Test It
Open your frontend ngrok URL and try:
- "500 on lunch"
- "how much did I spend on rent"

Both should work! 🎊
