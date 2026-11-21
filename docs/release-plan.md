# Release plan (from 20 November 2026)

Goal, unchanged from `docs/production-readiness-plan.md`: three people in one
household use the Play build for a week without Kian stepping in.

That plan's ten sessions are done in code. This file is the ordered list of
what is left before the Play internal track. Work through it top to bottom;
each step says who does it. Tick items in the PR that finishes them.

## Where things stand

- `main` is at `f8b5d36` (#99). CI and **Deploy on merge** are green.
- The QA follow-up work (`docs/qa-followup-plan.md`, sessions A, B, E, F, G)
  is **not on `main`**. It exists twice, on two unmerged branches:
  - `qa-followups`: 23 commits, ~150 files. Also has the Jest worktree
    exclusion, LF checkouts, and the Prettier check in CI.
  - `ccr-9604bb5d-44qfha`: 4 commits, ~75 files, the same sessions done
    separately. The two conflict in about 40 files (rules, reminders,
    households, auth).
- `sendWateringReminders` is still not known to be deployed (last known
  blocker: the deploy service account lacks `cloudscheduler.jobs.update`).
  The indexes deploy script fix for firebase-admin 14 is on `main`; whether
  the `notify_at` index is live hasn't been checked.
- No build with the QA fixes has been on a phone.

## Step 1: One QA branch (Claude, then Kian reviews)

- [x] Choose the base. Recommended: `qa-followups` (larger, newer, has the
      CI and Jest fixes). Diff `ccr-9604bb5d-44qfha` against it and bring
      over only what it lacks, then retire the ccr branch.
- [x] Settle the reminders index: `qa-followups` drops the `notify_at`
      index, so confirm `sendWateringReminders`' query works without it (or
      keep it) before deploying.
- [x] `pnpm validate`, `cd functions && npm test`, rules tests. The rules
      tests need **JDK 21** locally (Kian: install it, or rely on CI).
- [x] Old-build check: list every client write to `Users/{uid}` and plant
      docs, and confirm the new rules accept what the **current tester
      build** writes. Merging deploys rules and functions automatically
      (`docs/RELEASE.md`), so a rule that refuses old builds must wait until
      testers have the new build.
- [ ] Open one PR to `main` (Kian approves opening it).

## Step 1 notes (21 November 2026, branch `release-prep`)

- `release-prep` is `main` + `qa-followups` (main's #99 is identical to
  `qa-followups`' first commit, so conflicts were taken from `qa-followups`)
  - this plan. From `ccr-9604bb5d-44qfha` it adds what `qa-followups`
    lacked: the `Users/{uid}` key allowlist and no client delete, Delete
    hidden where the rules refuse it (`helpers/plants/permissions.ts`), the
    "Saved on this phone" and "Details unavailable offline" notes, waiting
    4 s for a just-added plant, and `canAskAgain` for notification
    permission. The ccr branch can be deleted once this merges.
- Index: `qa-followups` only drops an unused `CONTAINS` entry; the
  `notify_at` collection-group index stays. It has **never deployed**
  (every Deploy on merge run skipped the indexes job, because
  `firestore.indexes.json` hadn't changed). This branch changes the file,
  so merging deploys it. `sendWateringReminders` itself did deploy on
  15 November (run 43754384744), so the scheduler permission is fixed.
- Old builds: every client write to `Users/{uid}`, on `main` and on this
  branch, uses only `displayName`, `email`, `householdId` (own solo
  household), `notificationPrefs`, `timeZone`, `plantsMigratedAt`, and no
  build deletes the profile. Nothing a current tester build does is
  refused by the new rules.
- `pnpm validate` and the functions tests pass. Rules tests not run
  locally (JDK 17 here; CI runs them).

## Step 2: Phone check before merge (Kian, Claude can drive an emulator)

Build the PR branch with **Build Android test app** (or `pnpm android`) and
check the QA follow-up items:

- [x] Sign up with a display name, keyboard open: household is
      "<Name>'s home", member list shows "<Name> (you)". Password show/hide.
- [x] Cold start while signed in goes straight to Home, no Login flash.
- [x] Search: hint before typing, nothing under 2 characters, "No plants
      match" with "Add it yourself", no duplicate species.
- [x] Adding a plant opens its details.
- [x] Log Watering: instant splash; offline shows the "Saved on this phone"
      message, which clears once back online.
- [x] Starting offline shows plants by nickname with no alerts.
- [ ] Profile: rename shows "Saved"; Logout confirms; invite code field
      uppercases and adds the hyphen; notification switches grey out only
      after a permanent refusal.

Fix what fails in the same PR, with tests.

Run on the Android emulator on 21 November 2026 (signed in as the `test`
account): cold start, search, add, watering online and offline, start
offline, Logout, invite code field and the notification switches all pass.
Search showed Monstera deliciosa twice (catalogue entry with no
`scientific_name`); fixed. Sign-up passes (test account C, kept; credentials as `E2E_*_C` in
`.env.local`): "Robin's home" and "Robin (you)" on first load. Not done
yet: rename "Saved", which fails with NOT_FOUND until `updateDisplayName`
is deployed (re-check after Step 3). The invite field drops 0, 1, I, L
and O on purpose (not in the code alphabet).

## Step 3: Merge and deploy (Kian)

- [ ] Merge the PR. **Deploy on merge** deploys functions, rules and
      indexes. Watch the run.
- [x] Confirm `sendWateringReminders` and its Cloud Scheduler job exist.
      If the deploy fails on `cloudscheduler.jobs.update`, give the deploy
      service account the Cloud Scheduler Admin role and re-run.
- [ ] Confirm the Firestore index (if kept) shows as built.

## Step 4: Two-phone checkpoint (Kian)

Install the new test build on both phones, then run `docs/TEST_SCRIPT.md`:

- [ ] Household: invite, join, leave, remove, rename shows on the other
      phone, B can't delete A's personal plant.
- [ ] Section 3, reminders: a due plant gets a push from the server.
- [ ] The Maestro flows in `.maestro/` (never run yet).

## Step 5: Console and decisions (Kian)

- [ ] Firestore TTL policy on `Invites.expiresAt`.
- [ ] Restrict the Google API key (session 6).
- [ ] Alerts, backups and one test restore (session 8).
- [ ] Turn on App Check enforcement once every tester has the build
      (`ENFORCE_APP_CHECK=true` in a PR, then Firestore in the console).
- [ ] Decide whether a removed or leaving member's personal plants leave
      with them. Today they stay as shared plants and the dialogs say so;
      fine to launch as is.

## Step 6: Release (Kian)

- [ ] Screenshots (lead with a household screen showing "watered by"), per
      `docs/STORE_LISTING.md`.
- [ ] `firebase deploy --only hosting` for the privacy page; fill in the
      Play data safety form from `docs/STORE_LISTING.md`.
- [ ] `eas build --platform android --profile production`, then
      `eas submit` to the internal track (`docs/RELEASE.md`).
- [ ] Invite the three testers. Watch Crashlytics and function errors for
      the first day.
- [ ] After all three have signed in on the release build: remove the legacy
      `UserPlants` rule and `migrateUserPlants` (a small PR).
- [ ] After a quiet week: closed testing, then a staged production rollout.

## After launch (not blocking)

- QA sessions C (edit a plant), D (watering history and undo), H
  (housekeeping) and I (features) in `docs/qa-followup-plan.md`.
- The accepted risks in the readiness plan's "Found along the way":
  `joinHousehold`'s 500-write limit and ID clash, duplicate trigger delivery.
- Tidy the ~40 stale remote branches.
