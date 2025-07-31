# 📱 Build APK Instructions

## ✅ Setup Complete!
Your PFM app is now ready to build as an APK.

## 🔧 Build APK Steps:

### Method 1: Android Studio (Recommended)
```bash
# Open Android project in Android Studio
npx cap open android
```

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK will be generated in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Method 2: Command Line
```bash
# Navigate to android folder
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK (for distribution)
./gradlew assembleRelease
```

## 📱 APK Locations:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

## 🚀 Quick Build Command:
```bash
# Build and sync in one command
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

## 📋 Important Notes:

### Database Connection:
- ✅ Supabase works in mobile app
- ✅ Same database, same data
- ✅ Real-time sync across devices

### Backend API:
For production APK, update the API URL in:
- `src/mobile.js` - Change `apiUrl` to your deployed backend
- Or use Supabase Edge Functions instead of separate backend

### Features Working:
- ✅ Expense tracking with natural language
- ✅ Group management
- ✅ Real-time chat
- ✅ Analytics and insights
- ✅ Offline-first with Supabase sync

## 🎯 Next Steps:
1. Run `npx cap open android`
2. Build APK in Android Studio
3. Install APK on your phone
4. Share APK file with others!

**APK Size**: ~15-20MB (includes React + Capacitor runtime)