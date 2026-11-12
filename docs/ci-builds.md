# Building the Android app on GitHub

The **Build Android test app** workflow builds an installable APK on GitHub's
machines with `eas build --local`. That doesn't use the Expo plan's cloud
builds. The APK is signed with the app's real key, which is stored in EAS,
so Google sign-in and push notifications work.

## Set up once

1. **Create an Expo access token.** expo.dev → your account → Access tokens →
   Create token. Copy it.
2. **Save it in GitHub.** The repo → Settings → Secrets and variables →
   Actions → New repository secret, named `EXPO_TOKEN`.

## Build

1. GitHub → Actions → **Build Android test app** → Run workflow.
2. Enter the branch to build (for example `household-phase-2`) and run it.
   It takes about 20–30 minutes.
3. Open the repo's **Releases**. The pre-release "Test build: <branch>" has
   the APK. Tap it on your phone to install. Each new build of the same
   branch replaces it.

The APK is also kept with the workflow run for 14 days.

## Good to know

- It builds the `preview` profile from `eas.json`, the same as EAS's preview
  builds, so it installs over them.
- On a private repo, each build uses about 20–30 of GitHub's free Actions
  minutes (2,000 a month on the free plan). Public repos don't use any.
- iOS isn't covered: building for iPhone needs a Mac.
