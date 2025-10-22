# 🚀 Simple Share Guide

## You Need 3 Terminals

### Terminal 1: Backend
```bash
cd backend
python main.py
```

### Terminal 2: Backend Ngrok (IMPORTANT!)
```bash
ngrok http 8000
```
**COPY the https URL** → Example: `https://abc123.ngrok-free.app`

### Terminal 3: Frontend
```bash
npm start
```

## Update Config
Open `public/config.js` and paste your backend ngrok URL:
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'https://abc123.ngrok-free.app',  // ← PASTE HERE
  ENVIRONMENT: 'production'
};
```

Refresh browser at `http://localhost:3000`

## Share
Just share: `http://localhost:3000` 

**WAIT!** That won't work for others. You need:

### Terminal 4: Frontend Ngrok
```bash
ngrok http 3000
```
**SHARE this URL** with others!

---

## Why Both Ngrok Tunnels?
- Frontend ngrok → So others can access your UI
- Backend ngrok → So frontend can talk to backend from anywhere
