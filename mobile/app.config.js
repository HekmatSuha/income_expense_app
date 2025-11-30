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

const baseExpoConfig = appJson?.expo ?? {};

export default ({ config }) => ({
  // Spread incoming config first
  ...config,

  // Spread values from app.json next
  ...baseExpoConfig,

  // Your custom app settings
  name: "Income Expense",
  slug: "mobile",

  // ANDROID MUST COME AFTER spreads so it doesn't get overwritten
  android: {
    package: "com.hekmatsuha.incomeexpense",
    versionCode: 1,
  },
  plugins: [
    "expo-localization"
  ],
});
