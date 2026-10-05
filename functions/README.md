# Cloud Functions (Firebase) — PlantFriends

Backend proxy for the Trefle plant API. The Trefle token is stored as a secret
(`TREFLE_API_KEY`) on the server and is never bundled into the mobile client.

## Setup

```bash
cd functions
npm install
```

## Deploy

```bash
# From repo root
firebase deploy --only functions:searchPlants
```

## Configure the secret

```bash
firebase functions:secrets:set TREFLE_API_KEY
```

The function reads `process.env.TREFLE_API_KEY`. You can either set it via
Firebase Functions secrets (recommended) or as an env var in the deploy.

## Shared-care notifications

`onPlantWritten` and `sendWateringReminders` send watering pushes through the
Expo push service. See `docs/household-sharing-plan.md` for what they do.

Before they work on devices:

1. Upload push credentials to EAS once (an APNs key for iOS, an FCM V1
   service account key for Android): `eas credentials`.
2. Deploy the rules and the `notify_at` collection-group index:
   `firebase deploy --only firestore`.
3. Deploy the functions. `sendWateringReminders` is a scheduled function, so
   the project needs the Cloud Scheduler API enabled (Blaze plan):
   `firebase deploy --only functions`.

The message and timing logic is in plain modules with unit tests
(`plantMessages.js`, `notifyAt.js`, `push.js`, `leaveHousehold.js`); run them
from the repo root with `pnpm exec jest functions`.
