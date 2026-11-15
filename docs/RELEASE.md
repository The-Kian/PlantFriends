# Releasing and rolling back

Three things ship separately: the Android app, the Cloud Functions and the
Firestore rules.

## Backend (functions and rules)

Merging to `main` deploys by itself. When CI passes on `main`, **Deploy on
merge** (`.github/workflows/deploy.yml`) deploys:

- all Cloud Functions, if anything under `functions/` changed;
- `firestore.rules`, if it changed.

It compares with the last push whose CI passed, so if a push's CI failed, the
next green push deploys both. Watch it under Actions → **Deploy on merge**.

Before merging a change that the current app can't handle (for example a
rule that rejects what old builds write), ship the app first and wait until
every tester has it.

### App Check enforcement

Functions reject calls without an App Check token only when
`ENFORCE_APP_CHECK=true` in `functions/.env`. Change it in a pull request and
merge; the deploy picks it up. Turn it on only once every tester has a build
with App Check. Firestore enforcement is turned on in the Firebase console
(App Check → APIs → Cloud Firestore → Enforce).

### Roll back functions

1. Find the last good commit on `main` (its SHA or a tag).
2. Actions → **Deploy Cloud Functions** → Run workflow. Enter the functions
   (for example `searchPlants,deleteAccount,onPlantWritten`) and the good ref.
3. Revert the bad commit on `main` in a pull request, so the next merge
   doesn't deploy it again.

### Roll back rules

1. Actions → **Deploy Firestore rules** → Run workflow with the good ref.
2. Revert the bad commit on `main` in a pull request.

The Firebase console (Firestore → Rules) also keeps the history of published
rules, and can republish an older version straight away.

## Android app

### Release

1. Bump nothing: `eas.json` uses the remote app version with
   `autoIncrement`, so each production build gets a new version code. Change
   `version` in `app.config.js` for a new user-facing version.
2. Build: `eas build --platform android --profile production`.
3. Submit to the internal track: `eas submit --platform android --profile production`
   (needs `secrets/play-service-account.json`, which isn't in git).
4. In Play Console, promote the release from internal testing to the next
   track, with a staged rollout (for example 20%) for production.

Test builds for testers come from the **Build Android test app** workflow
(see `docs/ci-builds.md`).

### Roll back the app

Play doesn't let you go back to a lower version code.

1. Play Console → the release → **Halt rollout**. Nobody new gets it;
   people who already updated keep it.
2. Fix forward: revert the change on `main`, build again (it gets a higher
   version code) and release that.

If the problem is on the server side, roll back functions or rules instead;
that takes effect in minutes and needs nothing on the phones.
