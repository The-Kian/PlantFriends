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
