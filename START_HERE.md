# 🚀 ONE COMMAND TO RULE THEM ALL

## First Time Setup
```bash
npm install
```

## Start Everything
```bash
npm run dev
```

This starts BOTH frontend (port 3000) and backend (port 8000) together!

## Share with Ngrok
```bash
ngrok http 3000
```

Share the ngrok URL - **DONE!** ✅

## How It Works
- Backend runs on port 8000
- Frontend runs on port 3000
- Frontend proxies API calls to backend automatically
- Ngrok only needs to expose port 3000
- Everything works through one URL!

## Test It
1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Try: "500 on lunch" or "how much did I spend on rent"
4. Should work! 🎉

## To Share
1. Keep `npm run dev` running
2. In another terminal: `ngrok http 3000`
3. Share the ngrok URL
4. Others can use it immediately!
