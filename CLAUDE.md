# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm (via Corepack). The app needs a dev client / native build, not Expo Go.

```bash
pnpm start                 # Metro with dev client
pnpm android | pnpm ios    # native build + run
pnpm validate              # type-check + lint + test (run before finishing any change)
pnpm test                  # Jest (jest-expo); single file: pnpm test src/store/userPlantsSlice.test.ts
pnpm test -t "name"        # single test by name
pnpm lint:fix            # ESLint --fix, then Prettier (so import reorders stay formatted)
```

Cloud Functions (`functions/`, Node 22, CommonJS, firebase-functions v1-style `functions.https.onCall`):

```bash
cd functions && npm test   # runs root jest against functions/*.test.js
```

Firestore rules tests need the emulator and are excluded from root Jest:

```bash
cd firestore-tests && npm install && npm test   # firebase emulators:exec + node --test
```

## Architecture

React Native (Expo, dev-client) + TypeScript + Redux Toolkit + React Navigation, backed by React Native Firebase (Auth, Firestore, Functions, App Check, Crashlytics). Path aliases: `@/` → `src/`, `@assets/`, `@mocks/`.

- **Data flow**: screens → hooks in `src/hooks` (e.g. plant management/persistence hooks) → `src/helpers/firebase/*` for Firestore I/O + Redux `userPlantsSlice` for local state (optimistic updates). Keep Firestore access in helpers, not components.
- **Contexts**: `AuthProvider` (Firebase Auth incl. Google/Apple) gates navigation; `HouseholdProvider` supplies the current household. Plant data paths depend on household: see `src/helpers/firebase/householdPaths.ts` before adding any Firestore read/write.
- **Households** (shared plant care, invites, join, member removal): client in `src/helpers/household`, server in `functions/households.js`, `householdAdmin.js`, `inviteCode.js`. Design in `docs/household-sharing-plan.md`.
- **Cloud Functions** (`functions/index.js`): `searchPlants` (Trefle proxy so the API token never ships in the client), `deleteAccount` (anonymises plants into the client-unreadable `AnonymousPlants`, see `anonymise.js`), `createInvite`, `joinHousehold`, and the Firestore trigger `onPlantWritten` (`notifications.js`, push via `push.js`). Tests use `functions/fakeFirestore.js` rather than the emulator.
- **Security**: `firestore.rules` is the source of truth for access; change it together with `firestore-tests/rules.test.js`. App Check is wired in `src/services/AppCheck.ts`.
- **Notifications**: all pushes come from the server (`functions/reminders.js` for watering reminders, `notifications.js` for housemate activity, sent via `push.js`). The app only registers the device (`PushRegistration.ts`), asks permission, and clears stale reminders (`src/services/NotificationService.ts`); it schedules nothing locally.
- **Tests**: Firebase and native modules are mocked in `__mocks__/`; use `src/test-utils` (`renderWithProviders`, `renderHookWithProviders`, `Mock*` factories). Tests live next to source as `*.test.ts(x)`.

## Workflow notes

- `docs/production-readiness-plan.md` is a session-by-session plan. When working a session: do only that session, log unrelated findings under "Found along the way", update its Status table and tick tasks in the same PR, and list console/phone/secret steps as "Kian does" items in the PR description instead of attempting them.
- Rules deploys go through `functions/scripts/deployFirestoreRules.js` (Admin SDK, run by the "Deploy Firestore rules" workflow), not `firebase deploy`. Functions deploys via the deploy-functions workflow; secrets (`TREFLE_API_KEY`) via `firebase functions:secrets:set`.
- `ARCHITECTURE.md` is partly stale (lists RN 0.81 / Expo 54 / Firebase 21; actual versions are in `package.json`). Trust `package.json` and the code.
- Prettier: double quotes, semicolons, 80 cols, es5 trailing commas.
- Never add Co-Authored-By / "Generated with Claude" attribution to commits or PR descriptions in this repo.
- Firebase config files (`google-services.json`, `GoogleService-Info.plist`), `.env*`, and `secrets/` are environment-specific; don't print or commit new secrets.
