# Production readiness plan

Goal: three real people (one household, Android) use Plant Friends without
Kian doing anything by hand, and the app is safe to put on the Play Store.

The work is split into sessions. Each one is sized for a single coding
session, ends in one pull request, and leaves the app working.

## How to run a session

Start a new session and say: **"Do session N of
`docs/production-readiness-plan.md`."**

Rules for whoever does the session:

1. Read this file, `ARCHITECTURE.md` and the files listed under **Read first**
   for your session. Read `docs/household-sharing-plan.md` for any session
   that touches households, plants or notifications.
2. Do only that session. If you find other problems, add them to
   **Found along the way** at the bottom instead of fixing them.
3. Check the current code before trusting this plan. If a task is already
   done, tick it and move on.
4. Finish with `pnpm validate` passing, and `npm test` in `functions/` if you
   touched it.
5. In the same pull request, update the **Status** table and tick the tasks
   you finished. Write anything the next session needs under your session's
   **Notes**.
6. Steps under **Kian does** need a console, a phone or a secret. Don't try
   to do them; list them in the pull request description.

## Status

| # | Session | Depends on | Status |
| --- | --- | --- | --- |
| 1 | Invite and join a household | none | Not started |
| 2 | Leave a household, remove a member | 1 | Not started |
| 3 | Server-side watering reminders | none | Not started |
| 4 | Client switch to server reminders, notification settings | 3 | Not started |
| 5 | Security rules tests and tighter rules | none | Not started |
| 6 | App Check and rate limiting | none | Not started |
| 7 | CI and deploy pipeline | 5 | Not started |
| 8 | Monitoring, logging, backups | 3 | Not started |
| 9 | End-to-end test and manual test script | 1, 2, 4 | Not started |
| 10 | Privacy policy, store listing, release | all | Not started |

Sessions 1, 3, 5 and 6 don't depend on each other and can run in parallel.
Sessions 1 to 4 are the MVP features. Sessions 5 to 10 are production
readiness.

## Where things stand (November 2026)

- Household sharing phases 1 to 4 are on `main`: plants live under
  `Households/{hid}/Plants`, cards show who watered, phones register for
  push, and `onPlantWritten` tells carers when a housemate waters.
- Housemates are linked by hand with the **Link housemate** workflow
  (`functions/householdAdmin.js`). There is no invite, join or leave in the app.
- Reminders are still scheduled on the phone (`src/services/NotificationService.ts`).
  The scheduled `sendWateringReminders` function doesn't exist yet.
- `functions/index.js` exports `searchPlants`, `deleteAccount` and
  `onPlantWritten`. None use App Check, and `searchPlants` has no rate limit.
- There are no security rules tests and no end-to-end tests.
- CI (`.github/workflows/lint_and_test.yml`) runs type check, lint and the
  root Jest. Functions and rules are deployed by manual workflows.
- Android builds come from the **Build Android test app** workflow. iOS is
  out of scope for this plan.

---

## Session 1: Invite and join a household

Someone can invite a housemate from the app, and the housemate can join with
a code. This removes the need for the Link housemate workflow.

**Read first:** `functions/householdAdmin.js` and its test,
`functions/index.js`, `firestore.rules`, `src/context/household/HouseholdProvider.tsx`,
`src/helpers/household/setupHousehold.ts`, the Profile screen under `src/screens/settings`.

- [ ] `createInvite` callable function: the caller must be a member. It
      writes `Invites/{code}` with `householdId`, `createdBy`, `expiresAt`
      (7 days) and returns the code. Use a short code that is easy to type
      (8 characters, no look-alike letters), generated with a secure random source.
- [ ] `joinHousehold(code)` callable function: checks the invite exists and
      hasn't expired, then in one transaction does what
      `householdAdmin.js` does (add to `memberIds` and `members`, set
      `Users/{uid}.householdId`, add to `carerIds` on shared plants). Reuse
      that module rather than copying it. Cap household size at 10.
- [ ] Decide what happens to the joiner's existing plants and write it down
      here. Suggested: move them into the new household as personal plants.
- [ ] `Invites` rule: no client read or write.
- [ ] Profile: a Household card with the name, the members, an **Invite
      housemate** button (creates a code and opens the share sheet) and a
      **Join a household** button (code entry, with a confirmation that
      names the household before joining).
- [ ] Unit tests for both functions (expired code, wrong code, already a
      member, full household) and for the new UI.
- [ ] Update `docs/household-sharing-plan.md` so "Joining a household"
      describes the new flow.

**Kian does:** run **Deploy Cloud Functions** and **Deploy Firestore rules**,
then join from a second phone.

**Done when:** a second account joins from the app and sees the first
account's shared plants without signing out.

**Notes:**

---

## Session 2: Leave a household, remove a member

A mistaken join can be undone without the Firebase console.

**Read first:** the session 1 code, `functions/index.js` (`deleteAccount`,
which already handles a member disappearing), `functions/householdAdmin.js`.

- [ ] `leaveHousehold` callable function: removes the caller from
      `memberIds`, `members` and every `carerIds`, and puts them back in
      their solo household (`Households/{uid}`). Plants only they cared for
      become shared with whoever is left, the same as account deletion.
      Share that logic with `deleteAccount`.
- [ ] `removeMember(uid)` callable function: only the household's
      `createdBy` may call it. Same effect as that member leaving.
- [ ] If the creator leaves, pass `createdBy` to the longest-standing member.
- [ ] Profile: **Leave household** with a confirmation, and a remove button
      beside each member for the creator.
- [ ] Tests: last member leaves, creator leaves, removing yourself,
      non-creator tries to remove someone.

**Kian does:** deploy functions, then leave and rejoin on a test phone.

**Done when:** leaving returns you to your own empty household and the
others no longer see you as a carer.

**Notes:**

---

## Session 3: Server-side watering reminders

This is phase 5 of `docs/household-sharing-plan.md` (the section
"Time to water and Still thirsty"). Follow that design.

**Read first:** `docs/household-sharing-plan.md`, `functions/notifications.js`,
`functions/push.js`, `functions/plantMessages.js`, `firebase.json`.

- [ ] `functions/notifyAt.js`: pure function that moves a due time out of
      quiet hours (21:00 to 08:00 in the household's `timeZone`). Test it
      around midnight and around clock changes.
- [ ] `onPlantWritten` sets `notify_at` and `notify_stage` when
      `next_watering_date` or `reminders_enabled` changes. Make sure its own
      write can't trigger itself in a loop.
- [ ] `sendWateringReminders`, scheduled every 15 minutes: collection-group
      query on `notify_at <= now`, push to carers, move `due` to `nudge`,
      then clear. Use the `lastUpdateTime` precondition from the plan.
- [ ] `firestore.indexes.json` with the collection-group index, referenced
      from `firebase.json`, and deployed by the rules workflow.
- [ ] Add the new function to the **Deploy Cloud Functions** workflow's options.
- [ ] Tests with fake Firestore and fetch, as in `push.test.js`.

**Kian does:** deploy functions and indexes. Enable Cloud Scheduler if the
deploy asks. Set a test plant due in a few minutes and wait for the push.

**Done when:** a due plant sends one push to each carer, one nudge a day
later, then nothing.

**Notes:**

---

## Session 4: Client switch to server reminders, notification settings

**Read first:** `src/services/NotificationService.ts`,
`src/helpers/firebase/setNotificationPref.ts`, `HouseholdProvider.tsx`, the
Profile screen, the "Client side" section of the sharing plan.

- [ ] Stop scheduling local reminders for household plants. Cancel all
      previously scheduled local reminders once on upgrade.
- [ ] Keep the permission request, the foreground handler and the tap
      handler that opens the plant.
- [ ] When the live listener sees a plant watered, dismiss any delivered
      reminder for it.
- [ ] Ask for notification permission after the first plant is added, not
      on first launch.
- [ ] Profile: two switches, **Watering reminders** and **Housemate
      activity**, wired to `notificationPrefs`. Show a hint with a link to
      system settings when permission is denied.
- [ ] Tests for the upgrade cancel, the dismiss and the switches.

**Kian does:** install a new build on two phones and check no reminder
arrives twice.

**Done when:** every reminder comes from the server, and both switches stop
their pushes.

**Notes:**

---

## Session 5: Security rules tests and tighter rules

**Read first:** `firestore.rules`, the "Firestore rules" section of the
sharing plan, `.github/workflows/lint_and_test.yml`.

- [ ] Add `@firebase/rules-unit-testing` and the Firestore emulator, with a
      script to run the rules tests locally.
- [ ] Tests for every rule. At minimum: a non-member can't read or write a
      household or its plants; a member can't change `memberIds`; a client
      can't write `notify_at`, `notify_stage` or `addedBy`; `carerIds` can't
      include a non-member; users can't read each other's profile or
      devices; `AnonymousPlants` and `Invites` are closed.
- [ ] Tighten the catalog rule (`/Plants/{plantId}` create): limit the
      allowed keys and string lengths so it can't be filled with junk.
- [ ] Add type and length checks to household plant writes (nickname,
      notes, dates).
- [ ] Run the rules tests in CI.

**Done when:** the rules tests run in CI and fail if a rule is loosened.

**Notes:**

---

## Session 6: App Check and rate limiting

**Read first:** `functions/index.js`, `app.config.js`, `functions/README.md`.

- [ ] Add `@react-native-firebase/app-check` with Play Integrity, and a
      debug provider for development builds.
- [ ] Enforce App Check on every callable function. Put it behind a config
      switch so it can be turned on after the new build is installed.
- [ ] Per-user rate limit on `searchPlants` (for example 30 a minute, kept
      in Firestore) and on `joinHousehold` (to stop code guessing).
- [ ] Set `maxInstances` on every function.
- [ ] Validate the type and length of every callable function's input.
- [ ] Check no secret or token is written to the logs.

**Kian does:** register the app for App Check in the Firebase console, add
the debug token, deploy, then turn on enforcement for functions and
Firestore once all testers have the new build. Restrict the Android API key
in Google Cloud to the app's package and signing fingerprints.

**Done when:** a call without an App Check token is rejected, and the app
still works on a real phone.

**Notes:**

---

## Session 7: CI and deploy pipeline

**Read first:** everything in `.github/workflows`, `docs/ci-builds.md`,
`functions/package.json`.

- [ ] CI runs the functions tests and the rules tests on every pull request.
- [ ] Add a dependency audit (`pnpm audit` and `npm audit` in `functions/`)
      that fails on high severity.
- [ ] Add secret scanning for pull requests, and scan the git history once.
      Report anything found; don't rewrite history.
- [ ] Deploy functions, rules and indexes automatically on merge to `main`
      when their files change, after CI passes. Keep the manual workflows
      for rollback.
- [ ] Update `firebase-functions` and `firebase-admin` to current major
      versions and confirm the Node runtime is still supported.
- [ ] Write `docs/RELEASE.md`: how to release, and how to roll back the
      app (halt the Play rollout), functions (redeploy an older ref) and rules.

**Kian does:** make the CI checks required on `main` in the repository settings.

**Done when:** a merge that changes `functions/` deploys by itself, and a
failing test blocks the merge.

**Notes:**

---

## Session 8: Monitoring, logging, backups

**Read first:** `functions/push.js`, `functions/notifications.js`,
`src/components/ErrorBoundary.tsx`, `firebase.json`.

- [ ] Structured logs in every function (function name, household ID,
      counts). No emails, display names or push tokens.
- [ ] Log push receipt failures and a summary line for each
      `sendWateringReminders` run, so a silent failure is visible.
- [ ] Set the Crashlytics user ID on sign-in and record non-fatal errors
      from the Firestore helpers.
- [ ] Friendly error states for the failures users can hit: offline,
      search failed, join failed.
- [ ] Write `docs/OPERATIONS.md`: where to look when something breaks, the
      alerts that exist, and how to restore a backup.

**Kian does:** in the consoles, set up Crashlytics email alerts, a Cloud
Monitoring alert on function errors, a billing budget alert, and Firestore
scheduled backups (daily, kept 7 days). Restore one backup to a test
database to prove it works.

**Done when:** a thrown error in a function produces an email, and a
restore has been done once.

**Notes:**

---

## Session 9: End-to-end test and manual test script

**Read first:** `.agents/skills`, `docs/ci-builds.md`, `src/dev/seedFakePlants.ts`.

- [ ] One Maestro flow against a test build: sign in, add a plant, water
      it, see the "watered by" line, sign out.
- [ ] A second flow for invite and join if it can be done with two test accounts.
- [ ] Run the flow in CI on an Android emulator, or document why not and
      how to run it locally.
- [ ] Write `docs/TEST_SCRIPT.md` for the two-phone manual pass: join,
      shared watering push, due reminder and nudge, quiet hours, leave,
      account deletion with a housemate remaining, offline, notification
      permission denied, a fresh install on an old account.
- [ ] Check screen reader labels and text scaling on the main screens and
      fix what's missing.

**Kian does:** run the manual script on two phones and file what fails.

**Done when:** the flow passes and the manual script has been run once
with every failure fixed or written down.

**Notes:**

---

## Session 10: Privacy policy, store listing, release

**Read first:** `docs/PRIVACY_POLICY.md`, `docs/STORE_LISTING.md`,
`hosting/`, `scripts/build-privacy-page.js`, `eas.json`, `firestore.rules`.

- [ ] Privacy policy: housemates see your display name and watering
      activity; push tokens and time zone are stored; what happens to shared
      plants when you delete your account. Rebuild the hosted page.
- [ ] Store listing: lead with household sharing, and replace "Reminders
      are scheduled on your phone" with what is now true. Regenerate the screenshots.
- [ ] Write out the answers for the Play data safety form.
- [ ] Remove the legacy `Users/{uid}/UserPlants` rule and migration code if
      every tester is on a household build. Otherwise leave it and say why.
- [ ] Remove dev-only code paths and the crash-alert flag from the production build.
- [ ] Clear out **Found along the way** below: fix, or move to issues.

**Kian does:** deploy hosting, upload a production build to the Play
internal track, invite the three testers, then move to closed testing and a
staged rollout. Watch Crashlytics and function errors for the first day.

**Done when:** three people in one household have used the Play build for
a week without Kian stepping in.

**Notes:**

---

## Found along the way

Add things here that are outside your session.

-
