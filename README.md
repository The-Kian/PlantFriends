# PlantFriends 🌱

React Native plant care management app with Firebase backend.

> **Status:** Type check, lint, and tests passing

## Features

Plant search • Personal collection • Room organization • Custom care schedules • Watering reminders (local notifications) • Light/dark theme • Firebase auth (email, Google, Apple) • Crashlytics

## Quick Start

```bash
# Install
pnpm install

# Configure (copy .env.example to .env and set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
# Add Firebase config files (see ARCHITECTURE.md)

# Run
pnpm start
pnpm android  # or pnpm ios
```

## Package Manager

- This repo uses pnpm and Corepack — see `packageManager` in package.json.
- Prefer pnpm commands for consistent tooling.

Common equivalents:

```bash
# Start Metro + dev client
pnpm start

# Platforms
pnpm android
pnpm ios

# Tests & checks
pnpm test
pnpm test:coverage
pnpm lint
pnpm type-check
```

## Tech Stack

React Native 0.83 • Expo 55 • TypeScript 5.9 • Redux Toolkit • React Navigation • React Native Firebase 22 (Auth, Firestore, Functions, Crashlytics) • expo-notifications • Jest

## Commands

```bash
pnpm start / android / ios    # Development
pnpm test / test:coverage     # Testing
pnpm lint / type-check        # Quality checks
pnpm validate                 # Run all checks
```

## Backend & Configuration

- **Firestore security rules** — `firestore.rules` (deploy with `firebase deploy --only firestore:rules`)
- **Cloud Function proxy** — `functions/` hosts `searchPlants`, which proxies the Trefle plant API so the Trefle token never ships in the client bundle. Set the secret with `firebase functions:secrets:set TREFLE_API_KEY` and deploy with `firebase deploy --only functions`.
- **Account deletion** — `functions/` also hosts `deleteAccount`, which copies an anonymised version of the user's plants into `AnonymousPlants` (see `functions/anonymise.js` for exactly which fields are kept), then deletes `Users/{uid}` and the auth user. Clients cannot read `AnonymousPlants`.
- **Sign-in providers** — Google and Apple sign-in need to be enabled in Firebase Auth. After enabling Google, re-download `GoogleService-Info.plist` / `google-services.json` (iOS prebuild fails without `REVERSED_CLIENT_ID`) and add your Android SHA-1/SHA-256 fingerprints, including the EAS keystore's (`eas credentials`). Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` locally and with `eas env:create`.
- **Crash reporting** — Firebase Crashlytics (disabled in debug builds via `firebase.json`).
- **Privacy policy** — draft in `docs/PRIVACY_POLICY.md`; host it publicly before submitting to the stores.
- **Notifications** — local watering reminders via `expo-notifications` (see `src/services/NotificationService.ts`). Push notifications require a development/production build (not Expo Go).

## Documentation

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Patterns & structure

---

Made with 🌿 for learning and fun
