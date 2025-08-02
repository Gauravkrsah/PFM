#!/bin/bash

echo "Building PFM Android App..."

echo ""
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building React app..."
npm run build

echo ""
echo "Step 3: Syncing with Capacitor..."
npx cap sync android

echo ""
echo "Step 4: Opening Android Studio..."
npx cap open android

echo ""
echo "Android project is now ready in Android Studio!"