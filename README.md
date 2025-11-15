# Income Expense App

This project contains the Expo-based mobile client for tracking income and expenses.

## Firebase environment variables

The mobile application expects Firebase credentials to be supplied through Expo public environment variables. Copy the example file and update it with your Firebase project values before running any Expo command:

```bash
cd mobile
cp .env.example .env
# edit .env with the credentials from the Firebase console
```

Alternatively, you can configure these keys as [Expo environment secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-expo-projects) so they are available in EAS Build and Expo Application Services. Make sure to define each of the following variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

With the `.env` file in place (or the secrets configured), `firebase.js` reads the values at runtime to initialize the Firebase SDK correctly.
