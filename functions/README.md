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

## Functions

| Function | What it does |
| --- | --- |
| `searchPlants` | Proxies plant searches to Trefle. Needs the `TREFLE_API_KEY` secret. |
| `deleteAccount` | Deletes the caller's account and data. |
| `onPlantWritten` | Tells carers when a housemate waters a plant, and plans the plant's next reminder (`notify_at`, `notify_stage`). |
| `sendWateringReminders` | Every 15 minutes: sends "needs watering" to carers of plants that are due, and one "still thirsty" nudge a day later. Quiet hours 21:00 to 08:00 in the household's time zone (`notifyAt.js`). Needs the Cloud Scheduler API and the `Plants.notify_at` collection-group index (`firestore.indexes.json`). |
| `createInvite` | A household member gets an invite code (8 characters, 7 days, up to 10 members per household). Writes `Invites/{code}`. |
| `joinHousehold` | Joins the caller to the household a code belongs to, moving their plants across. `{ preview: true }` checks the code and writes nothing. |
| `leaveHousehold` | The caller leaves their household for a new one of their own, with no plants. |
| `removeMember` | `{ uid }`: the household's creator takes a member out, with the same effect as them leaving. |

## Logs and push delivery

Log through `logFor(name)` in `log.js`, which adds the function name as
`fn`. IDs and counts only: no emails, names, invite codes or push tokens.
Accepted pushes are kept in `PushTickets` until `sendWateringReminders`
has checked their Expo receipts (`checkPushReceipts` in `push.js`). What
the log lines mean is in `docs/OPERATIONS.md`.

## Tests

`functions/` has no test script of its own. Its tests run with the root Jest
(`pnpm exec jest functions`, also part of `pnpm test`), with the Firebase
packages mocked.

## Linking housemates (the app does this now)

The **Link housemate** workflow (GitHub → Actions) adds someone to another
person's household, or takes them out. The app can invite, join, leave and
remove, so this is only a fallback. Don't use it to unlink whoever set the
household up: use **Leave household** in the app. It runs `scripts/householdAdmin.js`
with a service account key stored as the `FIREBASE_SERVICE_ACCOUNT`
repository secret.

To set the secret up once:

1. Firebase console → Project settings → Service accounts → **Generate new
   private key**. This downloads a JSON file.
2. GitHub → the repo → Settings → Secrets and variables → Actions → **New
   repository secret**. Name it `FIREBASE_SERVICE_ACCOUNT` and paste the whole
   JSON file as the value.
3. Delete the downloaded file.

Both people must have opened the app at least once, so their accounts and
households exist.

## Deploying Firestore rules and indexes

The **Deploy Firestore rules** workflow publishes `firestore.rules`, then
`firestore.indexes.json` (`scripts/deployFirestoreIndexes.js`), with the
same `FIREBASE_SERVICE_ACCOUNT` secret. Publishing indexes needs the
**Firebase Admin** role (or **Cloud Datastore Index Admin**). Index builds
take a few minutes after the workflow finishes. Its service account
(`firebase-adminsdk-…`) needs the **Service Usage Consumer** role in Google
Cloud IAM as well as its default Firebase roles. **Deploy on merge** publishes rules by
itself when a rules change is merged into `main` and CI passes. To try a branch's rules before merging, run it from
Actions with that branch's name.

## Deploying functions from GitHub

**Deploy on merge** deploys every function when a change under `functions/`
is merged into `main` and CI passes. The **Deploy Cloud Functions** workflow
deploys the functions you name (for example `onPlantWritten`) from any ref;
use it to roll back or try a branch. See `docs/RELEASE.md`.

It uses the same `FIREBASE_SERVICE_ACCOUNT` secret, and its service account
needs two more roles in Google Cloud IAM: **Firebase Admin** and **Service
Account User**. `searchPlants` also reads a secret, so deploying it needs
**Secret Manager Viewer** as well.

## App Check, rate limits and input checks

`guards.js` holds the checks every callable uses:

- **App Check.** Calls without an App Check token are rejected only when
  `ENFORCE_APP_CHECK=true` in `functions/.env`. Leave it `false` until every
  tester has a build with App Check, then change it and redeploy.
- **Rate limits.** `rateLimit(uid, name, limit, windowMs)` keeps a counter per
  user at `RateLimits/{name}_{uid}`. `searchPlants` allows 30 a minute. Use it
  in `joinHousehold` when that's added. Add a TTL policy on `expiresAt` for the
  `RateLimits` collection group in the Firebase console so old counters are
  deleted.
- **Input.** `requireString` checks type and length. Never log the raw Trefle
  error: its URL holds the token (`redact` strips it).
- **maxInstances.** Every function runs at most `MAX_INSTANCES` (10) instances.

## Tests

`npm test` here runs the functions' unit tests with the root Jest, which
mocks the Firebase SDKs. CI also loads `index.js` against the real SDKs.
Firestore rules tests are in `firestore-tests/` (`npm test` there, needs Java).
