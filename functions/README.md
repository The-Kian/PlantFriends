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

## Linking housemates (until the app has invites)

The **Link housemate** workflow (GitHub → Actions) adds someone to another
person's household, or takes them out. It runs `scripts/householdAdmin.js`
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
