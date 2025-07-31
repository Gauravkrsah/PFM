# 🔧 Test Railway Deployment

## 🎯 **Find Your Railway URL**

1. **Go to your Railway dashboard**
2. **Click on your deployed service**
3. **Look for the URL** - it should be like:
   - `https://web-production-abc123.up.railway.app`
   - OR `https://your-app-name.up.railway.app`

## 🧪 **Test Your Backend**

### **Step 1: Test in Browser**
Visit your Railway URL + `/health`:
```
https://your-railway-url.up.railway.app/health
```

**Expected Response:**
```json
{"status":"healthy","gemini_available":true,"message":"Personal Finance Manager API is running"}
```

### **Step 2: Test Parse Endpoint**
Use this curl command (replace URL):
```bash
curl -X POST "https://your-railway-url.up.railway.app/parse" \
  -H "Content-Type: application/json" \
  -d '{"text":"500 on biryani"}'
```

**Expected Response:**
```json
{"expenses":[{"amount":500,"item":"biryani","category":"food"}],"reply":"Added 1 expense"}
```

## 🔧 **Fix Mobile App**

### **Step 1: Update URL in Chat.jsx**
Replace this line in `src/components/Chat.jsx`:
```javascript
const railwayUrl = 'https://YOUR_ACTUAL_RAILWAY_URL.up.railway.app'
```

### **Step 2: Rebuild Mobile App**
```bash
npm run build
npx cap sync android
```

### **Step 3: Test in Android Studio**
Build APK and test the chat functionality.

## 🚨 **Common Issues**

### **Issue 1: Railway App Sleeping**
- Railway free tier apps sleep after 30 minutes
- First request might be slow (10-15 seconds)
- Solution: Upgrade to paid plan or use Render

### **Issue 2: Environment Variables**
- Make sure `GEMINI_API_KEY` is set in Railway dashboard
- Go to Variables tab in Railway and add it

### **Issue 3: CORS Issues**
- Backend already configured for `allow_origins=["*"]`
- Should work from mobile app

## 📋 **Quick Debug Steps**

1. **Test Railway URL in browser** → Should show health status
2. **Check Railway logs** → Look for errors in Railway dashboard
3. **Update mobile app URL** → Use your actual Railway URL
4. **Rebuild and test** → `npm run build && npx cap sync android`

**Share your Railway URL and I'll help you fix the exact configuration!**