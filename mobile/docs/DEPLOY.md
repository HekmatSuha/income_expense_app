# Deployment Guide

## Prereqs
- Install the EAS CLI: `npm i -g eas-cli`
- Login: `eas login`
- Copy `.env.example` to `.env` and fill the Firebase values for each environment. Do not commit `.env`.

## Build channels
- `development`: internal dev client, channel `development`
- `preview`: internal builds for QA, channel `preview`
- `production`: store-ready builds, channel `production`

## Build commands
- Preview: `npm run build:preview`
- Production: `npm run build:production`

## Submitting
After a successful production build, run:
```
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```
Requires configured credentials in EAS.

## Release hygiene
- Bump version in `app.json` / `app.config.js` and use `appVersionSource: remote` (already set in `eas.json`).
- Update changelog.
- Ensure Firestore rules are deployed and Firebase credentials match the release environment.

## CI
GitHub Actions runs `npm run check` (Expo doctor) on PRs/pushes. Extend the workflow with EAS builds when store credentials are available.
