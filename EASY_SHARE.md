# 🚀 EASY SHARE - NO CONFIG EDITING!

## Step 1: Start Backend Ngrok
```bash
ngrok http 8000
```
**COPY the URL** (e.g., `https://abc123.ngrok-free.app`)

## Step 2: Set Environment Variable & Start
```bash
set REACT_APP_BACKEND_NGROK_URL=https://abc123.ngrok-free.app
npm run dev
```
(Replace with YOUR backend ngrok URL)

## Step 3: Start Frontend Ngrok (New Terminal)
```bash
ngrok http 3000
```
**SHARE this URL!** 🎉

## All in One Command
```bash
# Terminal 1
ngrok http 8000

# Terminal 2 (replace URL with yours from Terminal 1)
set REACT_APP_BACKEND_NGROK_URL=https://abc123.ngrok-free.app && npm run dev

# Terminal 3
ngrok http 3000
```

## How It Works
- Detects if accessed via ngrok
- Automatically uses backend ngrok URL
- No config file editing needed! ✅
