import 'dotenv/config';
import appJson from './app.json';

const requiredFirebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

requiredFirebaseKeys.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Missing required Firebase environment variable: ${key}`);
  }
});

export default () => ({
  ...appJson,
});
