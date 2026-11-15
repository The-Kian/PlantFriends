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
| 1 | Invite and join a household | none | Done and deployed (phone check left) |
| 2 | Leave a household, remove a member | 1 | Done and deployed (phone check left) |
| 3 | Server-side watering reminders | none | Done; goes live with session 4 |
| 4 | Reminders switch-over: client, deploy fixes, notification settings | 3 | Done (Kian's deploy and phone steps left) |
| 5 | Security rules tests and tighter rules | none | Done |
| 6 | App Check and rate limiting | none | Done (Kian's console steps left) |
| 7 | CI and deploy pipeline | 5 | Done |
| 8 | Monitoring, logging, backups | 3 | Done (Kian's console steps left) |
| 9 | End-to-end test and manual test script | 1, 2, 4 | Not started |
| 10 | Privacy policy, store listing, release | all | Not started |

Order for what's left: the **two-phone checkpoint** (below session 4), then
8, 9 and 10. Sessions 8 and 9 can run in parallel.

## Where things stand (November 2026)

- Household sharing phases 1 to 4 are on `main`: plants live under
  `Households/{hid}/Plants`, cards show who watered, phones register for
  push, and `onPlantWritten` tells carers when a housemate waters.
Checked against the code and the Actions runs on 15 November 2026.

- Housemates can invite and join with a code from Profile (session 1), and
  leave or remove a member (session 2). Their functions are deployed. Neither
  has been tried on a second phone yet.
- `functions/index.js` exports `searchPlants`, `deleteAccount`,
  `onPlantWritten`, `createInvite`, `joinHousehold`, `leaveHousehold`,
  `removeMember` and `sendWateringReminders`. All but the last are deployed.
  `onPlantWritten` already plans reminders (`notify_at`, `notify_stage`).
- `sendWateringReminders` is **not** deployed: the deploy service account
  lacks `cloudscheduler.jobs.update`. The Firestore index it needs is not
  deployed either: `functions/scripts/deployFirestoreIndexes.js` fails with
  `Cannot read properties of undefined (reading 'cert')`, which looks like
  the firebase-admin 14 problem fixed for the rules script in #83. The next
  **Deploy on merge** run skipped every job, so neither will retry by itself.
- The app still schedules its own reminders
  (`src/services/NotificationService.ts`). With the server reminders off,
  nobody gets a reminder twice; keep it that way until the session 4 build
  is on the phones.
- Every callable goes through `functions/guards.js` (App Check, rate limits,
  input checks). App Check is not enforced yet: `ENFORCE_APP_CHECK=false` in
  `functions/.env`.
- Rules tests (`firestore-tests/`), the functions tests, the dependency
  audits and the secret scan run in CI. Functions, rules and indexes deploy
  on merge to `main`; the manual workflows stay for rollback.
- The one-off secret history scan ran and failed. It flagged the Google API
  key in `google-services.json` (four hits, one under `android/app/`) and
  eight hits in `ios/Podfile.lock` that look like pod checksums. The API key
  ships in every build, so it isn't a secret, but it must be restricted
  (a session 6 step for Kian).
- There are no end-to-end tests.
- Android builds come from the **Build Android test app** workflow. The
  latest test build predates sessions 2 and 3, so it has no leave or remove
  buttons. iOS is out of scope for this plan.

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

- [x] `leaveHousehold` callable function: removes the caller from
      `memberIds`, `members` and every `carerIds`, and puts them back in
      their solo household (`Households/{uid}`). Plants only they cared for
      become shared with whoever is left, the same as account deletion.
      Share that logic with `deleteAccount`.
- [x] `removeMember(uid)` callable function: only the household's
      `createdBy` may call it. Same effect as that member leaving.
- [x] If the creator leaves, pass `createdBy` to the longest-standing member.
- [x] Profile: **Leave household** with a confirmation, and a remove button
      beside each member for the creator.
- [x] Tests: last member leaves, creator leaves, removing yourself,
      non-creator tries to remove someone.
- [ ] Manual test on two phones (Kian), with the session 4 build. Phone A
      set up the household, phone B joined it. Each needs a plant of its
      own, and one shared plant both look after.
  - [ ] **Leave:** on B, Profile → **Leave household** → confirm. B is in a
        new, empty household. B's plants stay with A; on A, a plant only B
        looked after is now shared, and B is gone from the members list and
        from every plant's carers.
  - [ ] **Rejoin:** A invites again, B joins with the new code. B sees the
        shared plants. B's old empty household is gone.
  - [ ] **Remove:** on A, tap remove beside B → confirm. Same result on B as
        leaving, without B doing anything (B's app switches over live).
  - [ ] **Not the creator:** on B (after rejoining), there's no remove
        button beside A.
  - [ ] **Creator leaves:** with B in the household, A leaves. B becomes the
        creator (B now has remove buttons). A ends up in a new household.
  - [ ] **Last member:** alone in a household, there's no **Leave
        household** button.
  - [ ] **Housemate watering push still works** after rejoining: B waters
        the shared plant, A gets "B watered …".

**Kian does:** deploy functions, then leave and rejoin on a test phone.

**Done when:** leaving returns you to your own empty household and the
others no longer see you as a carer.

**Notes:**

- **Decided:**
  - The leaver's plants stay in the household (the "Done when" says they
    land in an empty household). Plants only they looked after become shared
    with everyone left, through `unlinkWrites`, which `deleteAccount` now
    uses too. Before this, deleting an account left such plants with no carer.
  - The server creates the leaver's new household rather than clearing
    `householdId` for the app to do it. Someone who set up the household they
    leave can't get `Households/{uid}` back (the others are in it), so their
    new one gets a random ID. Nothing in the app assumed a household's ID is
    the uid of whoever is in it, except `createSoloHousehold`, which only runs
    when `householdId` is missing.
  - The new household's time zone is the person's `Users/{uid}.timeZone` if
    set, else the old household's.
  - The last member can't leave (`failed-precondition`); the app hides the
    button for a household of one.
  - `removeMember` on yourself is refused with "Use Leave household to
    leave."; a non-creator gets `permission-denied`.
  - A removed member whose profile already points at another household keeps it.
- Deploy `leaveHousehold`, `removeMember` and `deleteAccount` (its shared
  household branch changed).

---

## Session 3: Server-side watering reminders

This is phase 5 of `docs/household-sharing-plan.md` (the section
"Time to water and Still thirsty"). Follow that design.

**Read first:** `docs/household-sharing-plan.md`, `functions/notifications.js`,
`functions/push.js`, `functions/plantMessages.js`, `firebase.json`.

- [x] `functions/notifyAt.js`: pure function that moves a due time out of
      quiet hours (21:00 to 08:00 in the household's `timeZone`). Test it
      around midnight and around clock changes.
- [x] `onPlantWritten` sets `notify_at` and `notify_stage` when
      `next_watering_date` or `reminders_enabled` changes. Make sure its own
      write can't trigger itself in a loop.
- [x] `sendWateringReminders`, scheduled every 15 minutes: collection-group
      query on `notify_at <= now`, push to carers, move `due` to `nudge`,
      then clear. Use the `lastUpdateTime` precondition from the plan.
- [x] `firestore.indexes.json` with the collection-group index, referenced
      from `firebase.json`, and deployed by the rules workflow.
- [x] Add the new function to the **Deploy Cloud Functions** workflow's options.
- [x] Tests with fake Firestore and fetch, as in `push.test.js`.
- [ ] Manual test on two phones (Kian), with the session 4 build on both
      and notifications allowed. Reminders are never sent between 21:00 and
      08:00 in the household's time zone, so test during the day. To make a
      plant due soon, set its `next_watering_date` in the Firebase console
      (`Households/{hid}/Plants/{id}`, milliseconds since 1970) to about 5
      minutes from now; the scheduler runs every 15 minutes, so allow up to
      20.
  - [ ] **Due, personal plant:** A gets one "Time to water the … 💧". B
        gets nothing.
  - [ ] **Due, shared plant:** A and B each get one "The … needs watering
        💧".
  - [ ] **Tap opens the plant** the reminder is about, with the app closed
        and with it open.
  - [ ] **Watering clears it:** B taps **Watered**. The reminder disappears
        from A's tray too, and no nudge comes the next day.
  - [ ] **Nudge:** leave a due plant unwatered. About 24 hours after the
        reminder, one "The … is still thirsty 🥀" arrives, then nothing more.
  - [ ] **Quiet hours:** set a plant due at 22:00 tonight. Nothing arrives
        overnight; the reminder comes at about 08:00.
  - [ ] **Switches:** A turns off **Watering reminders** in Profile; a due
        plant reminds B only. Turn it back on. A turns off **When a housemate
        waters my plants**; B waters, A gets nothing.
  - [ ] **Per-plant switch:** turn reminders off on one plant; when due,
        nobody gets a reminder for it.
  - [ ] **No doubles:** over the whole test, no reminder arrives twice on
        the same phone.
  - [ ] **Permission denied:** deny notifications for the app in the phone's
        settings. Profile shows the hint, and **Open settings** goes to the
        app's settings page.
  - [ ] **Logs:** in the Firebase console, `sendWateringReminders` logs a
        summary line on each run, with no errors.

**Kian does:** deploy functions and indexes. Enable Cloud Scheduler if the
deploy asks. Set a test plant due in a few minutes and wait for the push.

**Done when:** a due plant sends one push to each carer, one nudge a day
later, then nothing.

**Notes:**

- **Decided:**
  - Planning runs inside a transaction that rereads the plant, so the plan
    always matches the plant as it is, whichever trigger runs last. Its own
    write only changes `notify_at` and `notify_stage`, which don't trigger
    planning, so it can't loop.
  - An overdue plant (due date in the past) is reminded about at the next
    sensible time, not skipped. A new or moved plant (including one moved in
    by `joinHousehold`) is planned when it's written, which settles the
    "moved plant keeps its old `notify_at`" item below.
  - The scheduler claims each plant first (writes the next stage with the
    `lastUpdateTime` precondition) and sends only if that worked. If someone
    waters it in between, nothing is sent and their new plan stays. The cost:
    if the push itself then fails, that one reminder is lost (the nudge still
    comes). The failure is logged.
  - The nudge is 24 hours after the reminder went out, moved out of quiet
    hours. (A reminder at 20:30 the day before the clocks go forward would
    otherwise nudge at 21:30, so that one waits until 08:00.) If a run is
    very late, the nudge is 24 hours from the run instead.
  - Push text: personal "Time to water the Monstera 💧" / "Tap Watered once
    it's done."; shared "The Monstera needs watering 💧" / "Whoever gets
    there first, tap Watered."; nudge "The Monstera is still thirsty 🥀" /
    "It was due yesterday. Tap Watered once it's done." `data.type` is `due`
    or `nudge`, matching the app's `PlantNotificationData`.
  - Each run handles at most 500 plants and logs a summary (`found`, `due`,
    `nudge`, `cleared`, `skipped`, `failed`, `devices`).
  - A catalog plant (`/Plants`) matched by the collection-group query is
    skipped and its `notify_at` cleared, since the catalog create rule lets
    the app write any field (see Found along the way).
- Indexes are deployed by `functions/scripts/deployFirestoreIndexes.js`
  (REST, like the rules script) from the **Deploy Firestore rules** workflow,
  which now also runs when `firestore.indexes.json` changes on `main`.
- **For session 4:** until the new app build is installed, a phone gets both
  its own local reminder and the server's. To avoid that on testers' phones,
  deploy `sendWateringReminders` together with the session 4 build.
  `onPlantWritten` can go out sooner: planning alone sends nothing.

---

## Session 4: Reminders switch-over

The app stops scheduling reminders, the server starts sending them, and the
deploy problems that kept session 3 from going live are fixed. One pull
request, so the server reminders and the new build arrive together.

**Read first:** the last **Deploy on merge** run that failed (Actions),
`.github/workflows/deploy.yml`, `functions/scripts/deployFirestoreIndexes.js`,
`functions/scripts/deployFirestoreRules.js` (already fixed in #83),
`.github/workflows/secret-scan.yml`, `src/services/NotificationService.ts`,
`src/helpers/firebase/setNotificationPref.ts`, `HouseholdProvider.tsx`, the
Profile screen, the "Client side" section of the sharing plan.

Deploy fixes:

- [x] Fix `functions/scripts/deployFirestoreIndexes.js` for firebase-admin 14
      and confirm the cause from the failed run's log first.
- [x] Make a failed deploy retry on the next merge. Today **Deploy on
      merge** compares against the last green CI push, so a deploy that
      failed is skipped next time.
- [x] Add a gitleaks allowlist for `ios/Podfile.lock` and both
      `google-services.json` paths, after checking each finding is what this
      plan says it is. Don't rewrite history.

Client:

- [x] Stop scheduling local reminders for household plants. Cancel all
      previously scheduled local reminders once on upgrade.
- [x] Keep the permission request, the foreground handler and the tap
      handler that opens the plant.
- [x] When the live listener sees a plant watered, dismiss any delivered
      reminder for it.
- [x] Ask for notification permission after the first plant is added, not
      on first launch.
- [x] Profile: two switches, **Watering reminders** and **Housemate
      activity**, wired to `notificationPrefs`. Show a hint with a link to
      system settings when permission is denied.
- [x] Tests for the upgrade cancel, the dismiss and the switches.

**Kian does:**

1. Before merging, give the deploy service account the Cloud Scheduler Admin
   role in Google Cloud IAM.
2. Merge, and check **Deploy on merge** deployed `sendWateringReminders`
   with its schedule.
3. Run the **Secret scan** workflow by hand and check it passes.
4. Build and install the new app on the testers' phones.
5. Only then run **Deploy Firestore rules** by hand once, which also deploys
   the index (this merge doesn't change `firestore.indexes.json`, so it
   isn't deployed by itself). Until the index exists, the reminder query
   fails and nothing is sent, which keeps old builds from getting each
   reminder twice.

**Done when:** every reminder comes from the server, both switches stop
their pushes, and a merge deploys functions and indexes without errors.

**Notes:**

- The index script was fixed in #87 (the failed run still used
  `admin.credential.cert`); this session only checked it.
- **Deploy on merge** now compares with the last push it deployed in full
  (its own last successful run), not the last green CI push, so a failed or
  cancelled deploy is retried by the next one. Runs before this change
  compared the old way, which is why the index needs the one manual run.
- The `sendWateringReminders` function itself already exists (created by the
  #85 deploy; only its Cloud Scheduler job failed, and the #87 deploy skipped
  it as unchanged). Whether the scheduler job exists wasn't checked. Either
  way no reminder can go out until the index is built.
- `.gitleaks.toml` allowlists `google-services.json` (the Firebase API key,
  public by design; it gets restricted in the two-phone checkpoint) and
  `ios/Podfile.lock` (CocoaPods `SPEC CHECKSUMS`; `ios/` is no longer
  tracked).
- The app schedules nothing now. `App.tsx` cancels every scheduled local
  notification on each launch, which covers the upgrade at no cost.
  `dismissStaleReminders` runs on each plants snapshot and clears `due` and
  `nudge` notifications for plants that are gone or whose next watering is
  in the future.
- Permission is asked (`registerForPush` with `prompt: true`) after adding a
  plant and after logging a watering, so a housemate who never adds a plant
  is still asked. Nothing asks on launch.
- The **Watering reminders** switch writes `notificationPrefs.reminders`,
  which `sendWateringReminders` already reads. The denied hint is checked
  each time Profile is shown and opens the app's page in system settings.

---

## Two-phone checkpoint (Kian, no code)

Do this once the session 4 build is on two phones. It closes the steps left
over from sessions 1, 2, 3, 6 and 7.

- [ ] Join from the second phone with an invite code, and see the first
      phone's shared plants.
- [ ] Leave and rejoin. Remove a member as the household's creator.
- [ ] Set a test plant due in a few minutes: one push to each carer, one
      nudge a day later, nothing twice.
- [ ] App Check: register the app in the Firebase console and add the debug
      token.
- [ ] Restrict the Android API key in Google Cloud to the app's package and
      signing fingerprints.
- [ ] Add Firestore TTL policies on `RateLimits.expiresAt` and
      `Invites.expiresAt`.
- [ ] Make the CI checks required on `main` in the repository settings.
- [ ] Once both phones have the new build, set `ENFORCE_APP_CHECK=true` in
      `functions/.env`, merge, and turn on enforcement for Firestore in the
      console. Check the app still works.

Write down anything that fails under **Found along the way**.

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
  deploys functions (all of them), rules and/or indexes if they changed since
  the last green push. The manual deploy workflows stay for rollback. The
  indexes job (added with sessions 2 and 3) runs
  `functions/scripts/deployFirestoreIndexes.js` when `firestore.indexes.json`
  changes.
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
  one-off history scan was run by hand on 15 November 2026 and failed: the
  Google API key in `google-services.json` (four hits) and eight hits in
  `ios/Podfile.lock`. Session 4 adds the allowlist; restricting the key is
  in the two-phone checkpoint.

---

## Session 8: Monitoring, logging, backups

**Read first:** `functions/push.js`, `functions/notifications.js`,
`src/components/ErrorBoundary.tsx`, `firebase.json`.

- [x] Structured logs in every function (function name, household ID,
      counts). No emails, display names or push tokens.
- [x] Log push receipt failures, so a silent failure is visible. (The
      summary line for each `sendWateringReminders` run exists already, from
      session 3.)
- [x] Set the Crashlytics user ID on sign-in and record non-fatal errors
      from the Firestore helpers.
- [x] Friendly error states for the failures users can hit: offline,
      search failed, join failed.
- [x] Write `docs/OPERATIONS.md`: where to look when something breaks, the
      alerts that exist, and how to restore a backup.

**Kian does:** in the consoles, set up Crashlytics email alerts, a Cloud
Monitoring alert on function errors, a billing budget alert, and Firestore
scheduled backups (daily, kept 7 days). Restore one backup to a test
database to prove it works.

**Done when:** a thrown error in a function produces an email, and a
restore has been done once.

**Notes:**

- The server half (logs, push tickets and receipts) reached `main` early,
  inside #90 ("Update google-services.json…"), which picked up the
  uncommitted work in the checkout. It is deployed if **Deploy on merge**
  ran for that merge. The client half, the rules test and the docs are this
  session's pull request.
- Logs go through `functions/log.js` (`logFor(name)`), which adds `fn` to
  every line. Callables log `finished` (info), `refused` (warning: an
  expected `HttpsError`, code only) and `failed` (error). Only errors
  should alert.
- Push delivery: accepted pushes are saved as `PushTickets/{ticketId}`
  (closed to the app, covered by the rules tests) and each
  `sendWateringReminders` run checks receipts older than 15 minutes
  (`checkPushReceipts` in `functions/push.js`). `DeviceNotRegistered` is
  logged at info and the device removed; anything else is an error.
- The Crashlytics user ID was already set on sign-in (`AuthProvider`), and
  `ErrorService` already recorded what it handled. Added: the two save
  helpers and the `HouseholdProvider` listeners, which only wrote to the
  console. Offline errors are not sent to Crashlytics.
- Friendly errors are in `src/helpers/errors/friendlyErrors.ts`. Search
  shows its message under the search box and no longer raises an alert (it
  used to raise up to two). Join, leave and invite say "You're offline" and
  tell a rate limit from a full household (both are `resource-exhausted`).
- **Not done, for session 9's manual pass:** there is no offline banner, and
  what a write does with no connection (adding a plant, tapping Watered)
  wasn't checked on a phone. Firestore queues the write, but the app awaits
  it, so the screen may wait until the connection is back. See Found along
  the way.
- `docs/OPERATIONS.md` has the alert list and the restore steps as
  checkboxes for Kian, and a "Restore last tested" line to fill in.

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
- [ ] Clear out **Found along the way** below: fix, or move to issues. Open
      now: `isVerified` on client catalog writes, stale
      `members[uid].displayName`, the 500-write limit and ID clash in
      `joinHousehold`, duplicate trigger delivery (`notify_for`), and
      retiring the **Link housemate** workflow.

**Kian does:** deploy hosting, upload a production build to the Play
internal track, invite the three testers, then move to closed testing and a
staged rollout. Watch Crashlytics and function errors for the first day.

**Done when:** three people in one household have used the Play build for
a week without Kian stepping in.

**Notes:**

---

## Found along the way

Add things here that are outside your session.

- (Session 8) **`release.keystore` and `tmp.txt` are on `main`**, committed
  in #90, and the repository is public. `tmp.txt` looks like the same
  keystore in base64. Treat the upload key as exposed: remove both files,
  and reset the upload key in Play Console (or make a new keystore if the
  app hasn't been uploaded yet). `.gitignore` covers `*.jks` but not
  `*.keystore`.
- (Session 8) Writes are awaited (`savePlantToFirebase`, `logWatering`).
  With no connection Firestore queues the write and the promise doesn't
  settle until it syncs, so adding a plant offline may leave the modal open.
  Check on a phone in session 9; the fix would be not awaiting the server
  for these writes, or an offline banner.
- (Session 8) `useFirebasePlantSearch` looks unused.

- (Session 5) The catalog rule lets a client set `isVerified: true` on a new
  plant. Consider forcing it to `false` for client writes.
- Expired `Invites` are never deleted. Set a Firestore TTL policy on
  `expiresAt` for the `Invites` collection (a console step, now in the
  two-phone checkpoint).
- `members[uid].displayName` doesn't update when someone changes their display
  name on Profile, so housemates keep seeing the old one.
- `joinHousehold` runs in one Firestore transaction, which allows 500 writes.
  Someone moving about 240 plants or more would get a generic error.
- `joinHousehold` would fail with a generic error if a moved plant's ID
  already exists in the new household (IDs are random, so very unlikely).
- ~~A moved plant keeps its old `notify_at` and `notify_stage`.~~ Settled in
  session 3: `onPlantWritten` replans a plant when it's created.
- ~~The catalog create rule (`/Plants/{plantId}`) accepts any fields, so the
  app could write `notify_at` to a catalog plant. `sendWateringReminders`
  clears it, but session 5 should limit the allowed keys.~~ Settled in
  session 5: `validCatalogPlant` allows only known keys.
- Firestore triggers can be delivered more than once. A late duplicate of
  the trigger for a watering would replan a plant already at `nudge` back to
  `due`, giving one extra reminder. Rare; a `notify_for` field holding the
  due date the plan was made for would fix it.
- ~~`sendWateringReminders` and `onPlantWritten` have no `maxInstances`.~~
  Settled when rebasing onto session 6: both use `MAX_INSTANCES`.
- The **Link housemate** workflow's `unlink` only clears `householdId`. For
  the person who set the household up, the app can't then make them a new
  household (`Households/{uid}` is the one they left). The app's leave and
  remove don't have this problem; the workflow could be retired.
- ~~The invite and join callables have no `maxInstances`, App Check or
  input length limits yet.~~ Settled in session 6; `leaveHousehold` and
  `removeMember` use the same guards.
