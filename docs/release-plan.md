# Release plan (from 20 November 2026)

Goal, unchanged from `docs/production-readiness-plan.md`: three people in one
household use the Play build for a week without Kian stepping in.

That plan's ten sessions are done in code. This file is the ordered list of
what is left before the Play internal track. Work through it top to bottom;
each step says who does it. Tick items in the PR that finishes them.

## Remaining work (21 November 2026, evening)

Done today: PRs #101 and #102 merged and deployed (functions, rules, the
`notify_at` index), the privacy page deployed, build 1.0.0 (12) on the Play
internal track, the store listing published (text, icon, feature graphic,
7 screenshots), the Android API key now also allows the EAS upload key.

**Kian, in Play Console**

- [ ] Testers: Testing → Internal testing → Testers → email list → share the
      opt-in link.
- [ ] Policy → App content: privacy policy URL, data safety (answers in
      `docs/STORE_LISTING.md`), ads: none, app access: restricted with the
      reviewer login, content rating (Utility, all No), target audience 13+,
      news/government/financial/health: No. None of these have an API.
- [ ] First day with testers: Android vitals, Crashlytics, function logs.
- [ ] After a quiet week: closed testing, then a staged production rollout
      (start at 20%).

**Two-emulator results, 21 November evening** (A = Robin or throwaway Dee,
B = Sam):

- Reminders (section 3): a personal plant reminds only its owner; a shared
  one reminds both; tapping opens the plant; watering on one phone clears
  both trays. Not run: the next-day nudge, quiet hours and the switches
  (covered by `functions/reminders.test.js`; check on real phones).
- "A leaves" (section 4): the housemate becomes the owner and keeps the
  plants. Finding: the household keeps the leaver's name ("Dee's home"), so
  both people now have a "Dee's home". Rename it after the new owner when
  it still has the default name.
- Account deletion (section 5): the account is removed and the housemate
  stays; see the decision below about the plants.
- Fixed: reminders now say "Monty needs watering" for a nickname (was "The
  Monty"), on top of #102's "Sam watered Monty".

**Kian, later**

- [ ] App Check enforcement once every tester has the build:
      `ENFORCE_APP_CHECK=true` in `functions/.env` in a PR, then Firestore
      enforcement in the console (App Check → APIs → Cloud Firestore).
- [x] Decide what a leaving member keeps: plants stay, on leave and on delete.

**Claude, next PRs**

- [ ] Rewrite the old catalogue descriptions ("A Araceae species") with a
      one-off Admin SDK script over `Plants`; the server now writes
      "A plant in the Araceae family" for new ones.
- [x] Grow our own catalogue: `searchPlants` now saves every Trefle result
      to `Plants`, and the app skips Trefle when the catalogue has 5 or more
      matches (`CATALOGUE_ENOUGH`).
- [ ] Catalogue photos: fill `images` on catalogue plants from Trefle's
      `image_url` where the slug matches (one-off script, same as above).
- [ ] Remove the `Users/{uid}/UserPlants` rule and `migrateUserPlants` once
      all three testers have signed in on the release build.
- [ ] QA sessions C (edit a plant), D (watering history and undo), H
      (dependency upgrades: Expo, RN, RN Firebase, audit overrides) and I
      (snooze, photos, rooms, search and sort), in that order; each is one PR
      per `docs/qa-followup-plan.md`.
- [ ] Delete stale remote branches (about 40, all merged or superseded,
      including `qa-followups` and `ccr-9604bb5d-44qfha`), with Kian's OK
      on the list first.

**Decided 21 November: deleting an account keeps the plants (like leaving).**
Done in the keep-plants-on-delete PR. Background:

**Decision: what a leaving or deleted member's plants do.** Today the two
paths disagree, and the published privacy policy matches only one of them:

- Leaving or being removed: the plants they added stay in the household (the
  dialogs say so).
- Deleting the account while housemates remain: `deleteAccount` **deletes**
  the plants they added (`functions/index.js`, asserted in
  `deleteAccount.test.js`), but `docs/PRIVACY_POLICY.md` says "the plants
  stay with the housemates who remain". Seen on the emulators on 21 November:
  Dee left a plant with Sam, rejoined, deleted the account, and Sam's plant
  went with it.

Recommended: make deletion behave like leaving (keep the plants, re-share
the ones only they looked after, clear `addedBy`), which also makes the
policy true. Or change the policy text to match the code. Options for
leaving:

1. Keep as is (simplest; the dialogs already say so).
2. Personal plants (`shared == false`, `addedBy == leaver`) move with them
   to their new solo household; shared ones stay. Needs `unlinkWrites` in
   `functions/householdAdmin.js` to move instead of re-share, the dialogs'
   copy, and the 500-write batch limit handled.
3. Ask at leave time. Most work; probably not worth it for three users.

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
- [x] Open one PR to `main` (Kian approves opening it).

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
- [x] Profile: rename shows "Saved"; Logout confirms; invite code field
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

## Two-emulator run (21 November 2026, after the deploy)

A = test account C (Robin), B = test account B (Sam), two emulators, dev build
from `main`:

- Join: a wrong code says "That code isn't valid or has expired."; the right
  code asks "Join Robin's home?"; B sees Robin's plants badged "Robin's",
  with no Delete on them.
- Shared watering: B waters a shared plant, A's card says "Watered today by
  Sam" and A gets the push.
- Rename on B shows on A at once; the household name follows.
- Leave, rejoin, remove: all pass; B's app switches by itself; no remove
  button for a non-creator; no Leave button when alone.
- Rename "Saved" passes now that `updateDisplayName` is deployed.
- Not run: "A leaves" and account deletion (section 5), to keep the test
  accounts; reminder timing (section 3) needs a console edit and a day.
- Fixed along the way: the push said "Sam watered the Monty" (now "Sam
  watered Monty" for nicknames), and disabled switches didn't look disabled.

## Step 3: Merge and deploy (Kian)

- [x] Merge the PR. **Deploy on merge** deploys functions, rules and
      indexes. Watch the run.
- [x] Confirm `sendWateringReminders` and its Cloud Scheduler job exist.
      If the deploy fails on `cloudscheduler.jobs.update`, give the deploy
      service account the Cloud Scheduler Admin role and re-run.
- [x] Confirm the Firestore index (if kept) shows as built.

## Step 4: Two-phone checkpoint (Kian)

Install the new test build on both phones, then run `docs/TEST_SCRIPT.md`:

- [x] Household: invite, join, leave, remove, rename shows on the other
      phone, B can't delete A's personal plant.
- [ ] Section 3, reminders: a due plant gets a push from the server.
- [ ] The Maestro flows in `.maestro/` (never run yet).

## Step 5: Console and decisions (Kian)

- [ ] ~~Firestore TTL policy on `Invites.expiresAt`.~~ Dropped by Kian.
- [x] Restrict the Google API key (session 6).
- [ ] Alerts (session 8). ~~Backups and a test restore~~ dropped by Kian.
- [ ] Turn on App Check enforcement once every tester has the build
      (`ENFORCE_APP_CHECK=true` in a PR, then Firestore in the console).
- [ ] Decide whether a removed or leaving member's personal plants leave
      with them. Today they stay as shared plants and the dialogs say so;
      fine to launch as is.

## Step 6: Release (Kian)

- [x] Screenshots (lead with a household screen showing "watered by"), per
      `docs/STORE_LISTING.md`.
- [x] `firebase deploy --only hosting` for the privacy page; fill in the
      Play data safety form from `docs/STORE_LISTING.md`.
- [x] `eas build --platform android --profile production`, then
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
