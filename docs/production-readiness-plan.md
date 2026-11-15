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
| 1 | Invite and join a household | none | Done, awaiting deploy |
| 2 | Leave a household, remove a member | 1 | Not started |
| 3 | Server-side watering reminders | none | Not started |
| 4 | Client switch to server reminders, notification settings | 3 | Not started |
| 5 | Security rules tests and tighter rules | none | Done |
| 6 | App Check and rate limiting | none | Done (Kian's console steps left) |
| 7 | CI and deploy pipeline | 5 | Done (history scan to run) |
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
- Housemates can invite and join with a code from Profile (session 1, once
  deployed). There is no leave in the app yet, so the **Link housemate**
  workflow (`functions/householdAdmin.js`) still does that.
- Reminders are still scheduled on the phone (`src/services/NotificationService.ts`).
  The scheduled `sendWateringReminders` function doesn't exist yet.
- `functions/index.js` exports `searchPlants`, `deleteAccount`,
  `onPlantWritten`, and now `createInvite` and `joinHousehold`. None use App Check, and `searchPlants` has no rate limit.
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

- [x] `createInvite` callable function: the caller must be a member. It
      writes `Invites/{code}` with `householdId`, `createdBy`, `expiresAt`
      (7 days) and returns the code. Use a short code that is easy to type
      (8 characters, no look-alike letters), generated with a secure random source.
- [x] `joinHousehold(code)` callable function: checks the invite exists and
      hasn't expired, then in one transaction does what
      `householdAdmin.js` does (add to `memberIds` and `members`, set
      `Users/{uid}.householdId`, add to `carerIds` on shared plants). Reuse
      that module rather than copying it. Cap household size at 10.
- [x] Decide what happens to the joiner's existing plants and write it down
      here. Suggested: move them into the new household as personal plants.
      **Decided:**
      - Codes are 8 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, picked
        with `crypto.randomInt`, shown as `XXXX-XXXX`. Input is upper-cased
        and stripped of spaces and hyphens.
      - Invites are multi-use and expire 7 days after creation. Every
        `createInvite` call makes a new code.
      - Households hold at most 10 members.
      - The joiner's plants move into the new household as personal plants:
        same document ID and data, with `addedBy` and `userId` set to them,
        `carerIds: [uid]`, `shared: false`.
      - The joiner's old household is deleted in the same transaction, but
        only if they are its only member. Otherwise the join is refused.
      - A wrong code and an expired code give the same error.
      - The confirmation step is `joinHousehold({ code, preview: true })`,
        which runs every check and writes nothing.
- [x] `Invites` rule: no client read or write.
- [x] Profile: a Household card with the name, the members, an **Invite
      housemate** button (creates a code and opens the share sheet) and a
      **Join a household** button (code entry, with a confirmation that
      names the household before joining).
- [x] Unit tests for both functions (expired code, wrong code, already a
      member, full household) and for the new UI.
- [x] Update `docs/household-sharing-plan.md` so "Joining a household"
      describes the new flow.

**Kian does:** run **Deploy Cloud Functions** and **Deploy Firestore rules**,
then join from a second phone.

**Done when:** a second account joins from the app and sees the first
account's shared plants without signing out.

**Notes for session 2:**

- The joiner's solo household is deleted when they join. The app recreates
  it when `Users/{uid}.householdId` is cleared (`createSoloHousehold`), so
  `leaveHousehold` only needs to clear `householdId`, as `unlinkWrites` does.
- Invites are multi-use, so there is nothing to revoke when someone leaves.
- The **Link housemate** workflow stays until leave exists in the app.
- `moveWrites` and `linkWrites` are in `functions/householdAdmin.js`; the
  join logic is in `functions/households.js`, with an in-memory Firestore for
  tests in `functions/fakeFirestore.js`.
- Functions tests run with the root Jest (`pnpm exec jest functions`); `functions/`
  has no test script of its own.


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

- [x] Add `@firebase/rules-unit-testing` and the Firestore emulator, with a
      script to run the rules tests locally.
- [x] Tests for every rule. At minimum: a non-member can't read or write a
      household or its plants; a member can't change `memberIds`; a client
      can't write `notify_at`, `notify_stage` or `addedBy`; `carerIds` can't
      include a non-member; users can't read each other's profile or
      devices; `AnonymousPlants` and `Invites` are closed.
- [x] Tighten the catalog rule (`/Plants/{plantId}` create): limit the
      allowed keys and string lengths so it can't be filled with junk.
- [x] Add type and length checks to household plant writes (nickname,
      notes, dates).
- [x] Run the rules tests in CI.

**Done when:** the rules tests run in CI and fail if a rule is loosened.

**Notes:**

- Tests are in `firestore-tests/` (own `package.json`, run with node:test on
  the emulator; needs Java). `npm test` there. CI job: **Firestore rules tests**.
- Household plant checks cover the fields the app writes; unknown keys are
  still allowed there because the migration copies old `UserPlants` docs as
  they are. The catalog rule allows only `IPlant` keys plus `contributed_by`.
- `Invites` has no rule, so it's closed. Session 1 must add rules (and tests)
  for it.

---

## Session 6: App Check and rate limiting

**Read first:** `functions/index.js`, `app.config.js`, `functions/README.md`.

- [x] Add `@react-native-firebase/app-check` with Play Integrity, and a
      debug provider for development builds.
- [x] Enforce App Check on every callable function. Put it behind a config
      switch so it can be turned on after the new build is installed.
- [x] Per-user rate limit on `searchPlants` (for example 30 a minute, kept
      in Firestore) and on `joinHousehold` (to stop code guessing).
- [x] Set `maxInstances` on every function.
- [x] Validate the type and length of every callable function's input.
- [x] Check no secret or token is written to the logs.

**Kian does:** register the app for App Check in the Firebase console, add
the debug token, deploy, then turn on enforcement for functions and
Firestore once all testers have the new build. Restrict the Android API key
in Google Cloud to the app's package and signing fingerprints.

**Done when:** a call without an App Check token is rejected, and the app
still works on a real phone.

**Notes:**

- Client: `src/services/AppCheck.ts`, started at the top of `App.tsx`. Debug
  provider in dev builds, with an optional `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`.
  Needs a new native build (config plugin added).
- Server: `functions/guards.js` (`requireCaller`, `rateLimit`,
  `requireString`, `redact`, `MAX_INSTANCES`). The switch is
  `ENFORCE_APP_CHECK` in `functions/.env` (committed; no secrets).
- `joinHousehold` doesn't exist yet. Session 1: call `requireCaller`,
  `requireString` and `rateLimit(uid, "joinHousehold", 5, 60 * 60 * 1000)`
  (or similar) and set `maxInstances: MAX_INSTANCES`.
- Kian also: add a TTL policy on `RateLimits.expiresAt`.

---

## Session 7: CI and deploy pipeline

**Read first:** everything in `.github/workflows`, `docs/ci-builds.md`,
`functions/package.json`.

- [x] CI runs the functions tests and the rules tests on every pull request.
- [x] Add a dependency audit (`pnpm audit` and `npm audit` in `functions/`)
      that fails on high severity.
- [x] Add secret scanning for pull requests, and scan the git history once.
      Report anything found; don't rewrite history.
- [x] Deploy functions, rules and indexes automatically on merge to `main`
      when their files change, after CI passes. Keep the manual workflows
      for rollback.
- [x] Update `firebase-functions` and `firebase-admin` to current major
      versions and confirm the Node runtime is still supported.
- [x] Write `docs/RELEASE.md`: how to release, and how to roll back the
      app (halt the Play rollout), functions (redeploy an older ref) and rules.

**Kian does:** make the CI checks required on `main` in the repository settings.

**Done when:** a merge that changes `functions/` deploys by itself, and a
failing test blocks the merge.

**Notes:**

- `firebase-functions` is now 7.x and `firebase-admin` 14.x, on Node 22
  (supported). Code uses the v1 API from `firebase-functions/v1`; moving to
  v2 functions is optional and would change the function URLs/regions config.
- **Deploy on merge** (`deploy.yml`) runs after CI succeeds on `main` and
  deploys functions (all of them) and/or rules if they changed since the last
  green push. The manual deploy workflows stay for rollback. There's no
  `firestore.indexes.json` yet; add an indexes step when there is one.
- Functions unit tests run in the root Jest (as before); the new **Functions**
  CI job loads `index.js` against the real SDKs. `npm test` in `functions/`
  now runs them.
- Audit: `functions/`, `firestore-tests/` and the app all fail on high. The
  app's transitive fixes are `pnpm.overrides` in `package.json`, each held to
  its current major (`^`). Four advisories need a major jump under Expo and
  are in `pnpm.auditConfig.ignoreGhsas`: `image-size` x2 and `zod` (Expo
  CLI/Metro, build time only) and `decode-uri-component` (React Navigation
  deep-link parsing; worst case a slow parse on the user's own phone). Drop
  each ignore when Expo/React Navigation move to the fixed major. When Expo
  is upgraded, check whether the overrides are still needed.
- Secret scanning: **Secret scan** (gitleaks) runs on pull requests. The
  one-off history scan wasn't run in the session; run the workflow by hand
  from Actions (it scans the full history) and check the result.

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

- (Session 5) The catalog rule lets a client set `isVerified: true` on a new
  plant. Consider forcing it to `false` for client writes.
- Expired `Invites` are never deleted. Set a Firestore TTL policy on
  `expiresAt` for the `Invites` collection (a console step).
- `members[uid].displayName` doesn't update when someone changes their display
  name on Profile, so housemates keep seeing the old one.
- `joinHousehold` runs in one Firestore transaction, which allows 500 writes.
  Someone moving about 240 plants or more would get a generic error.
- `joinHousehold` would fail with a generic error if a moved plant's ID
  already exists in the new household (IDs are random, so very unlikely).
- A moved plant keeps its old `notify_at` and `notify_stage`, which is fine
  until session 3, which will need to recheck them.
