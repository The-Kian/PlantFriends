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
| `onPlantWritten` | Tells carers when a housemate waters a plant. |
| `createInvite` | A household member gets an invite code (8 characters, 7 days, up to 10 members per household). Writes `Invites/{code}`. |
| `joinHousehold` | Joins the caller to the household a code belongs to, moving their plants across. `{ preview: true }` checks the code and writes nothing. |

## Tests

`functions/` has no test script of its own. Its tests run with the root Jest
(`pnpm exec jest functions`, also part of `pnpm test`), with the Firebase
packages mocked.

## Linking housemates (also possible with an invite code in the app)

The **Link housemate** workflow (GitHub → Actions) adds someone to another
person's household, or takes them out. Use it to remove someone until the app
can leave a household. It runs `scripts/householdAdmin.js`
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

## Deploying Firestore rules

The **Deploy Firestore rules** workflow publishes `firestore.rules` with the
same `FIREBASE_SERVICE_ACCOUNT` secret. Its service account
(`firebase-adminsdk-…`) needs the **Service Usage Consumer** role in Google
Cloud IAM as well as its default Firebase roles. It runs by itself when a rules change
is merged into `main`. To try a branch's rules before merging, run it from
Actions with that branch's name.

## Deploying functions from GitHub

The **Deploy Cloud Functions** workflow deploys the functions you name (for
example `onPlantWritten`) from a branch. Run it from Actions after merging a
change under `functions/`.

It uses the same `FIREBASE_SERVICE_ACCOUNT` secret, and its service account
needs two more roles in Google Cloud IAM: **Firebase Admin** and **Service
Account User**. `searchPlants` also reads a secret, so deploying it needs
**Secret Manager Viewer** as well.
