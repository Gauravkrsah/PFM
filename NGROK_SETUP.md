# 🌐 Ngrok Setup Guide

## Steps to Share Your Project

### 1. Start Backend (Terminal 1)
```bash
cd backend
python main.py
```
Backend runs on `http://localhost:8000`

### 2. Start Frontend (Terminal 2)
```bash
npm start
```
Frontend runs on `http://localhost:3000`

### 3. Create Backend Ngrok Tunnel (Terminal 3)
```bash
ngrok http 8000
```
Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### 4. Update Frontend Environment
Edit `.env` file:
```
REACT_APP_API_BASE_URL=https://abc123.ngrok.io
```

### 5. Restart Frontend
Stop the frontend (Ctrl+C) and restart:
```bash
npm start
```

### 6. Create Frontend Ngrok Tunnel (Terminal 4)
```bash
ngrok http 3000
```
Share this URL with others!

## Quick Test
Visit your frontend ngrok URL and try:
- "500 on lunch"
- "how much did I spend on rent"

Both should work now! ✅
