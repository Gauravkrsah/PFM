import { Capacitor } from '@capacitor/core';

export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

export const getMobileConfig = () => {
  if (isMobile()) {
    return {
      apiUrl: 'https://your-backend-url.com/api', // Update this with your deployed backend
      platform: Capacitor.getPlatform()
    };
  }
  return {
    apiUrl: 'http://localhost:8000',
    platform: 'web'
  };
};