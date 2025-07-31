import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pfm.mobile',
  appName: 'PFM Mobile',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
