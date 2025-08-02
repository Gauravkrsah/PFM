# 📱 PFM Android App

This is the Android version of the Personal Finance Manager built with Capacitor.

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- Android Studio installed
- Java Development Kit (JDK) 11 or higher

### Build and Run

#### Option 1: Using the build script (Windows)
```bash
./build-android.bat
```

#### Option 2: Using the build script (Mac/Linux)
```bash
chmod +x build-android.sh
./build-android.sh
```

#### Option 3: Manual steps
```bash
# Install dependencies
npm install

# Build the React app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 📱 Mobile Features

- **Native Status Bar**: Styled to match the app theme
- **Splash Screen**: Custom branded splash screen
- **Mobile-Optimized UI**: Touch-friendly interface with proper spacing
- **Offline Support**: Basic offline functionality
- **Native Navigation**: Smooth mobile navigation experience

## 🛠️ Development

### Making Changes
1. Make changes to your React code in the `src/` directory
2. Build the app: `npm run build`
3. Sync changes: `npx cap sync android`
4. The changes will be reflected in Android Studio

### Debugging
- Use Chrome DevTools for web debugging
- Use Android Studio's logcat for native debugging
- Enable USB debugging on your Android device

### Building for Production
1. Build the React app: `npm run build`
2. Sync with Capacitor: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. In Android Studio: Build → Generate Signed Bundle/APK

## 📦 App Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/pfm/mobile/
│   │   │   └── MainActivity.java
│   │   ├── res/
│   │   │   ├── values/strings.xml
│   │   │   └── layout/activity_main.xml
│   │   └── assets/public/
│   │       └── [React build files]
│   └── build.gradle
└── build.gradle
```

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)
- App ID: `com.pfm.mobile`
- App Name: `PFM - Personal Finance Manager`
- Web Directory: `build`

### Android Specific Settings
- Minimum SDK: 22 (Android 5.1)
- Target SDK: 34 (Android 14)
- Compile SDK: 34

## 🚨 Troubleshooting

### Common Issues

1. **Build fails**: Make sure you have the latest Android SDK and build tools
2. **App crashes on startup**: Check logcat for errors, ensure all plugins are properly registered
3. **White screen**: Make sure the React build was successful and assets are properly synced

### Useful Commands
```bash
# Clean and rebuild
npx cap clean android
npm run build
npx cap sync android

# Check Capacitor doctor
npx cap doctor android

# Run on device/emulator
npx cap run android
```

## 📱 Testing

### On Emulator
1. Open Android Studio
2. Create/start an Android Virtual Device (AVD)
3. Run the app from Android Studio

### On Physical Device
1. Enable Developer Options and USB Debugging
2. Connect device via USB
3. Run the app from Android Studio

## 🔄 Updates

When updating the app:
1. Update version in `package.json`
2. Update version in `android/app/build.gradle`
3. Build and sync: `npm run build && npx cap sync android`
4. Test thoroughly before release