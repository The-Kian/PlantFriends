# PlantFriends 🌱

React Native plant care management app with Firebase backend.

> **Status:** Type check, lint, and 202 tests passing

## Features

Plant search • Personal collection • Room organization • Custom care schedules • Watering reminders (local notifications) • Light/dark theme • Firebase auth

## Quick Start

```bash
# Install
pnpm install

# Configure (copy .env.example to .env)
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

React Native 0.83 • Expo 55 • TypeScript 5.9 • Redux Toolkit • React Navigation • Firebase (Auth, Firestore, Functions) • Sentry • expo-notifications • Jest

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
- **Sentry** — crash/error reporting via `EXPO_PUBLIC_SENTRY_DSN`. See `.env.example`.
- **Notifications** — local watering reminders via `expo-notifications` (see `src/services/NotificationService.ts`). Push notifications require a development/production build (not Expo Go).

## Documentation

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Patterns & structure

---

Made with 🌿 for learning and fun
