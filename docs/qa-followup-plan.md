# QA follow-up plan (November 2026)

Work left over from the end-to-end QA run of 17 November 2026 (two Android
emulators, a code review and a server review, on `main` at `eb8721f`). The
simple fixes went in with the PR that added this file; everything below is
what is left.

Each session is written so a fresh Claude Code session can pick it up on its
own. Follow `CLAUDE.md` and the session rules in
`docs/production-readiness-plan.md`: do one session per PR, run
`pnpm validate`, log anything unrelated under "Found along the way" at the
bottom of this file, tick the tasks and update the Status table in the same
PR, and list console, phone and secret steps as "Kian does" items in the PR
description.

Line numbers are from `eb8721f` and will drift; search for the names given.

## Status

| #   | Session                                                        | Depends on                    | Size           | Status                                                                                     |
| --- | -------------------------------------------------------------- | ----------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| A   | Leftover small fixes                                           | none                          | S              | Done (no Copy button: expo-clipboard is not a dependency)                                  |
| B   | Names that stay right                                          | none                          | M              | Done (Kian: deploy functions, two-phone rename check)                                      |
| C   | Edit a plant, notes, per-plant settings                        | none                          | M–L            | Not started                                                                                |
| D   | Watering history and undo                                      | C (shares the details screen) | M              | Not started                                                                                |
| E   | Household plant rules and invite lifecycle                     | none                          | M              | Done; what a leaving member keeps unchanged (Kian: run rules tests on JDK 21, deploy, TTL) |
| F   | Reliable reminders                                             | none                          | M              | Done (Kian: deploy functions, delete old index)                                            |
| G   | Start-up, offline and listener robustness                      | none                          | M              | Done; checked on an emulator 21 Nov (see `docs/release-plan.md`)                           |
| H   | Housekeeping: line endings, modular Firebase, test noise, deps | none                          | M (spread out) | Done except the dependency upgrades and audit overrides                                    |
| I   | Features: snooze, photos, rooms, search and sort               | C, D                          | L              | Not started                                                                                |

A, B, E, F, G and H don't touch the same files much and can run in parallel.
C before D; I last.

## Already fixed (for context)

In the PR that added this file:

- Adding a plant from search failed with `permission-denied`. The client sent
  `isVerified: true` from Trefle and null fields, and the catalog rule
  rejects both (`saveBasePlantToFirebase.ts`).
- A failed save closed the add form and lost the input. It now stays open,
  and a missing name is caught before saving (`PlantSearch/index.tsx`).
- "Forgot password?" used the iOS-only `Alert.prompt`. It's now an inline
  email field (`screens/auth/login.tsx`).
- Delete now asks for confirmation (`plantCard.tsx`).
- `auth/invalid-credential` and `auth/too-many-requests` have friendly
  messages, and expected user mistakes are no longer sent to Crashlytics
  (`ErrorService.ts`).
- 6-character passwords are accepted, and validation says which field is
  wrong (`validateCredentials.ts`, `AuthContent.tsx`).
- The login and sign-up loading overlay sits on top of the form rather than
  replacing it, so a failed attempt keeps what was typed.
- Home's "Needs watering" counts overdue, due today or tomorrow, and
  never-watered plants, and shows "No plants yet" with an empty account.
- `getDaysUntilWatering` rounds instead of `ceil` (clock changes).
- `ThemedButton` and the tab bar set accessibility labels, so screen readers
  no longer say ", Add a plant".

---

## Session A: Leftover small fixes

Each is a few lines. Do them as one PR.

- [x] **Remove date of birth from sign-up.** It's collected and never stored
      or used (`AuthForm.tsx` around lines 42 and 159, `AuthTypes.tsx:16`
      `dateOfBirth`, the `DatePickerField` on the sign-up form). Remove the
      field, the type member and the tests that set it. Check
      `docs/PRIVACY_POLICY.md` and `docs/STORE_LISTING.md` don't mention it.
- [x] **Dev defaults on the auth form.** `AuthForm.tsx:14-31` pre-fills
      `test@gmail.com`, `password`, "Test User" and a 1997 birthday when
      `process.env.NODE_ENV === "development"`. Use `__DEV__`, and leave the
      fields empty unless an `EXPO_PUBLIC_DEV_PREFILL` flag is set, so dev
      builds behave like release builds by default.
- [ ] **Dead branch in login.** `AuthProvider.tsx` `login()` has an
      `auth/user-not-found` branch with a bare `Alert.alert("User not
    found")`. Email enumeration protection means it never fires; route
      everything through `ErrorService`. Do the same for the bare alerts in
      `register`, `update` and `logout` (search `Alert.alert(` in that file).
- [ ] **Alert titles.** `ErrorService.showAlert` uses the context string as
      the title ("Login", "Fetch Plant By ID", "Save Plant"). Give each context
      a human title ("Couldn't log in", "Couldn't save the plant"), or pass a
      title with the context.
- [x] **Keyboard on sign-up.** `AuthContent.tsx` uses a plain `ScrollView`.
      Wrap it in `KeyboardAvoidingView` (behavior `"padding"` on iOS,
      `"height"` on Android) so Confirm Password and Sign Up aren't hidden.
      Add a show/hide toggle to password fields (an eye icon as a
      `TextInputField` right accessory).
- [x] **Invite code field** (no Copy button: `expo-clipboard` isn't a dependency; press and hold copies). In `HouseholdCard.tsx` the join field has the
      placeholder `XXXX-XXXX`. Uppercase input as typed, insert the hyphen
      after 4 characters, and drop characters outside the code alphabet
      (`functions/inviteCode.js`: no 0, 1, I, L, O). Change the client
      message "Codes are 8 letters and numbers" (`helpers/household/invites.ts`
      around line 81) to "Check the code: it's 8 characters, like
      K7QM-3PXD." Add a **Copy** button next to the shown invite code
      (`expo-clipboard`, which needs a dev-client rebuild; otherwise
      `Share` is fine).
- [x] **Search empty states.** `PlantSearch/index.tsx` and
      `PlantSearch/Results`: show a hint before typing ("Search by common or
      Latin name"), a "No plants match …" message with the "Add it yourself"
      button for no results, and don't search until 2 characters.
- [x] **De-duplicate search results.** The same species appears twice, once
      from the catalogue ("Monstera Deliciosa") and once from Trefle
      ("Fruit-salad-plant", scientific name _Monstera deliciosa_). In
      `useCombinedPlantSearch`, drop Trefle results whose first scientific
      name matches a catalogue plant's, ignoring case.
- [x] **Copy and contrast.** - `mapTreflePlantToIPlant.ts:116` builds "A Araceae species"; use
      "A plant in the Araceae family". - Make the watering copy consistent: "Water in 3 days" vs "Next
      watering in 6 days" (`getWateringStatus`). - The `warning` amber (`Colors.ts:21`, `#C4842A`) on the pale card is
      about 2.9:1. Darken it to reach 4.5:1 for text. - The disabled button style is nearly invisible.
- [x] **Visual bits.** - The "Watering Logged!" splash is see-through (`WateringSplash.tsx`
      uses hard-coded colours and `Colors.light`); give it the theme's
      `surface` background. - Switches use the system teal; set `trackColor` and `thumbColor` from
      the theme. - Plant cards and the details hero need an `onError` fallback to the
      leaf placeholder (seen with "Watermelon"). - The customisation modal close button is 36dp
      (`plantCustomization.styles.ts:50`) and the household remove icon has
      `minHeight: 28`; make both at least 48dp, or add `hitSlop`.
- [x] **Feedback.** Show "Saved" after renaming on Profile. Ask for
      confirmation on Logout. After adding a plant, open its details rather
      than going to Home (`PlantSearch/index.tsx`
      `navigation.navigate("Tab")`).
- [x] **Notification prompt.** Before the system prompt
      (`PlantSearch/index.tsx` `registerForPush(..., { prompt: true })`,
      `usePlantManagement.ts:75`, `PlantDetails/index.tsx:115`), show one
      line saying why. On Profile, show "Notifications are turned off" only
      once permission has been denied, not when it has never been asked
      (`NotificationService.ts:45-72`), and grey out the switches while
      denied.
- [ ] **Release config.** Redux `devTools: true` in `store/store.ts:11`:
      make it `__DEV__`. `index.js:5` imports `seedFakePlants`
      unconditionally: guard it with `if (__DEV__) require(...)`.

Done when: `pnpm validate` passes, and each item has been checked on a
phone or emulator (sign-up with the keyboard open, joining with a lowercase
code, a search with no results).

---

## Session B: Names that stay right

**Problem.** Sign up as "Sam" and the household is "pf.e2e.b.85390's home"
and the member list says "pf.e2e.b.85390". Renaming on Profile updates only
`Users/{uid}`, so housemates keep seeing the old name (also logged in the
production plan's "Found along the way").

**Cause.**

1. `signup.tsx` calls `register({ email, password })` and then
   `update({ displayName })`.
2. `createUserWithEmailAndPassword` fires `onAuthStateChanged` straight away
   with `displayName` null.
3. `HouseholdProvider.tsx` (around line 137) calls `createSoloHousehold`, which
   falls back to `email.split("@")[0]` (`setupHousehold.ts` around lines
   22-26, 53 and 420-426).
4. `AuthProvider.register` also writes `Users.displayName` as the email
   (around line 86).
5. `AuthProvider.update` (around line 164) writes only
   `Users/{uid}.displayName`.

**Plan.**

1. Pass `displayName` into `register`. After the account is created, call
   `updateProfile(user, { displayName })` _before_ anything reads the name,
   and write `Users/{uid}.displayName` with the entered name rather than the
   email.
2. Make household setup wait for the name: in `HouseholdProvider`, when the
   user has just signed up, use the `Users/{uid}.displayName` if present,
   then `user.displayName`, and only then the email local part. Or create the
   solo household inside `register` after the name is set, and have the
   provider skip creation when a household already exists. Pick whichever is
   less racy, and write a test for the order.
3. Add a callable `updateDisplayName` in `functions/households.js`. It
   updates `Users/{uid}.displayName` and `Households/{hid}.members[uid].displayName`
   (the rules don't let a member write another member's entry, so it must be
   server-side). If the household name is still the auto one
   (`"<old name>'s home"`) and the user created it, rename it to
   `"<new name>'s home"`. Use the existing `guards.js` (auth, App Check, rate
   limit, length limit).
4. Call it from `AuthProvider.update`.

**Tests.**

- Jest for `register` passing the name through.
- `HouseholdProvider` choosing the right name.
- `functions/households.test.js` for the callable, using `fakeFirestore`.
- A rules test if the rules change.

**Done when.**

- A fresh sign-up as "Sam" shows "Sam's home" and "Sam (you)" on first load.
- Renaming to "Sammy" updates the other phone's member list within a few
  seconds.

**Kian does.** Deploy functions. Run the rename part of `docs/TEST_SCRIPT.md`
on two phones.

---

## Session C: Edit a plant, notes, per-plant settings

**Problem.**

- Once added, a plant can't be changed. The only action is delete.
- Plant details has only Back and Log Watering.
- The details screen has a "Your Notes" card (`PlantDetails/index.tsx`
  around 258-261) that nothing can fill.
- `handleUpdatePlant` exists in `usePlantManagement.ts` (around 100-114) but
  no UI calls it.
- The per-plant reminder and share switches described in the docs aren't
  reachable from details.
- In the add form, the species fields ("Name", care fields) are silently
  ignored for a species already in the catalogue, because the catalogue doc
  isn't rewritten. Only "Custom Name" sticks.

**Plan.**

1. Add an **Edit** button on Plant details that opens the existing
   customisation modal and `PlantForm` in edit mode, pre-filled from the
   `IUserPlant`.
2. In both add and edit mode:
   - Show species (catalogue) fields read-only when the species exists in
     the catalogue, with a short "From the plant library" note.
   - Move "Nickname" (today's "Custom Name") to the top.
   - Add a **Notes** multiline field (`custom_notes`).
3. Save through `handleUpdatePlant`, which goes to the household plant path
   (`householdPaths.ts`) via `queuedWrite`. Check `firestore.rules`
   `validHouseholdPlant` allows the edited keys, and that `addedBy`,
   `notify_at` and `notify_stage` are never sent.
4. Move **delete** into the details screen (with the existing confirmation),
   and consider removing the trash icon from cards to stop mis-taps. During
   QA a plant was deleted by a mis-tap.
5. Add the **Reminders for this plant** switch and, when the household has 2
   or more members, the **Shared with household** switch, using the existing
   helpers (`setPlantSharing.ts`, and the reminders field the functions
   already honour). Search `notify` and `shared` in `functions/` to find
   the field names.
6. Fix the delete rollback in `usePlantManagement.ts`: it re-adds with
   `addPlant`, which can duplicate the plant. Use an upsert, and
   `queuedWrite` for the delete so it doesn't hang offline.

**Tests.**

- `PlantForm` in edit mode.
- `usePlantManagement` update and delete rollback.
- Rules tests for editing allowed and forbidden keys.

**Done when.**

- You can rename a plant, move its room, change its schedule, add notes,
  and switch reminders and sharing off and on from details.
- All of it survives an app restart and shows on the other phone.

---

## Session D: Watering history and undo

**Problem.** A mistaken "Log Watering" can't be undone, and there is no
history view.

**Plan.**

1. Check how `logWatering.ts` stores waterings today: it sets
   `last_watered_date` and `last_watered_by`. Add a `Waterings` subcollection
   under the household plant (`{ at, by, byName }`), written in the same
   batch.
2. Add rules for the subcollection: members can create their own entries
   (`by == request.auth.uid`) and delete their own entry from the last 24
   hours. Add rules tests.
3. Add a history list on Plant details (last 10 entries, with dates and who
   watered).
4. Add **Undo** on the "Watering Logged!" splash, and on the newest history
   entry for 24 hours. Undo deletes the entry and restores the previous
   `last_watered_date` and `next_watering_date`. Make sure `onPlantWritten`
   replans the reminder correctly (`functions/notifications.js` and
   `reminders.js`), and that the housemate "watered" push isn't re-sent.
5. `deleteAccount` and `anonymise.js` need to handle the new subcollection;
   decide whether history is anonymised or deleted.

**Done when.** Water, undo, and the plant's due date and reminder go back to
what they were on both phones. History shows the last waterings with names.

---

## Session E: Household plant rules and invite lifecycle

**Problem.**

1. Any household member can update or delete any household plant, including
   a housemate's personal one (`firestore.rules`,
   `/Households/{hid}/Plants/{plantId}`: `allow delete: if isMember(hid)`,
   and update has no ownership check). The joined phone showed a delete
   button on the other person's personal plant.
2. Invites stay valid after the member who made them is removed or deletes
   their account. Any number can exist per household at once, and each can be
   reused until it expires after 7 days (`functions/households.js` around
   25-105; `index.js` around 332).
3. Removing a member keeps the plants they brought, as shared plants
   (`householdAdmin.js` `unlinkWrites`, around 62-95). The removed person
   lands in an empty household. The "Remove Sam?" dialog says nothing about
   it.
4. `Users/{uid}` is fully client-writable, including `householdId`
   (`firestore.rules:5-6`). `joinHousehold` reads the old household from it
   (`households.js` around 90-100). The membership checks stop misuse today,
   but it's broader than needed.

**Plan.**

1. Rules for household plants:
   - Delete only if `resource.data.addedBy == request.auth.uid`, or the plant
     is `shared == true`, or the user is in `carerIds`.
   - Update allows anyone in the household to change only the watering keys
     (`last_watered_*`, `next_watering_date`) on shared plants, and full edits
     only for carers or `addedBy`.
   - Write rules tests for each case in `firestore-tests/rules.test.js`.
   - Hide the delete and edit controls in the UI when the rule would deny
     them.
2. Invites:
   - Creating a new invite marks the household's older invites revoked.
   - `leaveHousehold`, `removeMember` and `deleteAccount` revoke invites
     created by that user.
   - Cap active invites per household (e.g. 3).
   - Keep the 7-day expiry, and set the Firestore TTL policy on `expiresAt`
     (already a "Kian does" item).
3. Decide what a removed or leaving member keeps. The options are: plants
   they added and only they care for go with them, or the current behaviour.
   Whichever is chosen, say it in the confirm dialogs ("Their 2 plants stay
   here as shared plants"). Ask Kian before changing the behaviour.
4. Users rule: allow clients to write only `displayName` and settings keys,
   with `householdId` written only by functions. Check that every client
   write to `Users/{uid}` still passes first: `AuthProvider`,
   `setupHousehold.ts`, the notification settings. Note that session B moves
   the name write server-side.

**Done when.**

- Rules tests cover each case.
- On two phones, B can't delete A's personal plant (no button, and the rule
  denies it).
- A new invite stops the old code working.
- A removed member's old code fails.

**Kian does.** Deploy rules with the "Deploy Firestore rules" workflow, deploy
functions, set the TTL policy, and run section 4 of `docs/TEST_SCRIPT.md`.

---

## Session F: Reliable reminders

**Problem.**

1. `reminders.js` (around 181-204) moves a plant's `notify_stage` forward
   before the push is accepted. If `push.js` fails, the first reminder is
   lost.
2. Housemate "watered" pushes (`notifications.js`) ignore quiet hours. The
   store listing says nothing is sent between 21:00 and 08:00
   (`notifyAt.js:2-3`).
3. Duplicate trigger delivery can replan a plant from `nudge` back to `due`,
   giving one extra reminder (already in the production plan: add
   `notify_for`).
4. `push.js` (around 138-144) uses `Promise.all` of token-cleanup deletes
   with no per-call catch, so tickets aren't saved if one fails.
5. Smaller items in `index.js`:
   - The Trefle fetch has no timeout (around 127).
   - The rate-limit slot is spent before the API-key check (113 vs 115).
   - `AnonymousPlants` rows use random IDs, so a retried `deleteAccount`
     duplicates them (around 219-224); use the plant ID.

**Plan.**

1. Claim, then send, then confirm:
   - The claim writes `notify_stage: "sending"` with a lease timestamp.
   - On success, advance the stage.
   - On failure, roll back so the next run retries.
   - A lease older than 10 minutes counts as failed.
2. Watered pushes respect quiet hours: queue them to 08:00, or drop them.
   Since "B watered X" at 08:00 is stale, dropping is probably right; decide
   and update the store text if needed.
3. Add `notify_for`, the due date the plan was made for, and ignore triggers
   whose plan is for an older date.
4. Use `Promise.allSettled` in `push.js` and log failures.
5. Add an `AbortController` timeout (8s) on the Trefle fetch, check the key
   before spending a rate-limit slot, and give anonymised rows deterministic
   IDs.

**Tests.** `functions/*.test.js` with `fakeFirestore` for each case. The push
failure test makes the Expo client throw.

**Done when.** Function tests cover a send failure followed by a retry, quiet
hours for watered pushes, and a duplicate trigger.

**Kian does.** Deploy functions. Run section 3 of `docs/TEST_SCRIPT.md`.

---

## Session G: Start-up, offline and listener robustness

**Problem.**

1. `AuthProvider`'s `initializing` is never read, so signed-in users see
   Login briefly on every cold start.
2. `RootLayout.tsx` (around 290) calls `createStackNavigator()` inside the
   component, and the `AuthContext` value isn't memoised (around 254), so
   the stack can remount.
3. A failed species fetch is cached as null for the session
   (`HouseholdProvider.tsx` around 70, `useMergedPlant.ts` around 52).
   `fetchFirebasePlantById.ts:21` shows an alert titled "Fetch Plant By ID"
   for each plant. Starting offline stacks alerts and shows "Unnamed Plant"
   until restart.
4. Joining a household logged
   `Plants listener failed: permission-denied`: the old household's listener
   isn't stopped before membership changes. It's harmless, but it reaches
   Crashlytics.
5. If household creation fails, there is no retry
   (`HouseholdProvider.tsx` around 163-169). Logout aborts when
   `unregisterForPush` fails offline (`AuthProvider.tsx` around 194).
6. With no connection, Log Watering gives no visible feedback for about 3
   seconds (the `queuedWrite.ts` grace period). Show the splash at once and
   a small "Will sync when you're online" note.

**Plan.**

1. Show the splash or a spinner while `initializing`.
2. Move the navigator to module scope and `useMemo` the context value.
3. Don't cache fetch failures (retry on the next render or on reconnect).
   Never alert from background fetches; log them and show the plant's
   nickname with a muted "Details unavailable offline".
4. Stop the plants listener when `householdId` changes, before the join or
   leave callable resolves. Treat a `permission-denied` from a listener for a
   household you just left as expected (no Crashlytics).
5. Add a "Try again" state when household setup fails. Logout should
   continue when push unregistering fails, logging the error.
6. Watering: show the splash optimistically.

**Done when.**

- A cold start of a signed-in app goes straight to Home.
- Starting in airplane mode shows plants by nickname with no alerts.
- Join and leave log no permission errors.

---

## Session H: Housekeeping

Split this into small PRs.

- [ ] **Line endings.** `pnpm format:check` fails on 137 files because of
      CRLF from `core.autocrlf=true`, while `.prettierrc` says `lf`. Add a
      `.gitattributes` with `* text=auto eol=lf` (and `*.png binary` and so
      on), run `git add --renormalize .` in one commit on its own, and add
      `format:check` to CI.
- [ ] **React Native Firebase modular API.** Each flow logs dozens of
      "namespaced API deprecated" warnings, and v23+ removes the namespaced
      API. Call sites: - `AuthProvider.tsx`: about 13 `auth()`, 1 `functions()`, and
      `user.updateProfile`. - `socialAuth.ts`: `auth.GoogleAuthProvider`, `auth.AppleAuthProvider`. - `helpers/household/invites.ts`: `functions()` ×5. - `fetchTreflePlants.ts`: `functions()`. - `services/AppCheck.ts`. - `dev/seedFakePlants.ts`.
      Migrate one file per commit and update the `__mocks__` to match.
- [x] **Test noise.** 22 `act()` warnings (SocialSignInButtons 11,
      HookContainer 4, ProfileSettingsScreen 4, StackView 3) and 2
      InteractionManager deprecation warnings. Fix the awaits so `pnpm test`
      prints nothing on a pass.
- [ ] **Dependencies.** - `pnpm audit --prod` shows 6 high and 4 moderate advisories (picomatch,
      glob, minimatch, uuid), mostly build-time via the Expo font and icon
      tree. Add pnpm overrides where safe. - Plan the Expo SDK 55 → 58 / React Native 0.83 → 0.88 / RN Firebase
      22 → 27 upgrade as its own session after the modular migration.
- [ ] `useFirebasePlantSearch` looks unused (already logged); remove it if so.
- [ ] Remove the unused `notify_at` CONTAINS index from
      `firestore.indexes.json` if nothing queries it (check `reminders.js`
      around 146-148 first).
- [ ] **App Check.** `functions/guards.js` (around 17-27) enforces App Check
      only when `ENFORCE_APP_CHECK=true`. Confirm it's set in production; if
      not, it's a "Kian does" item.

---

## Session I: Features

Bigger product work, in rough order of user value. Each one needs its own
short design note before coding.

1. **Snooze or skip, and "water all due".**
   - Snooze sets `next_watering_date` to tomorrow without logging a watering.
   - Skip ("it rained") logs a skip and re-plans.
   - A **Water all** button on Home logs every due plant.
   - Add an "Upcoming this week" list on Home below "Needs watering".
2. **Search, sort and filter on My Plants.** A search box, sorting by due
   date, name or room, and a filter for shared or personal.
3. **Custom rooms.** Rooms come from a fixed list today
   (`GeneralInfoFields.ts`), and a plant with no room lands in
   "Other Rooms". Store household rooms on the household doc
   (`rooms: string[]`; the rules need the key allowed) and offer "Add room"
   in the form.
4. **Plant photos.**
   - Use `expo-image-picker` (needs a dev-client rebuild) and upload to
     Firebase Storage under `households/{hid}/plants/{plantId}/`.
   - Add Storage rules for household members only.
   - Show a thumbnail on cards and the details hero.
   - `deleteAccount` and plant delete must remove the files.
5. **Other care tasks.**
   - Generalise the watering schedule to tasks (`water`, `fertilise`,
     `mist`, `repot`), each with its own frequency and last-done date.
   - `functions/reminders.js` plans per task.
   - This is the largest item; do it after D and F.
6. **Profile extras.**
   - App version and build number.
   - A "Contact support" email address shown as text.
   - Check `EXPO_PUBLIC_PRIVACY_POLICY_URL` is set in every EAS profile:
     the row is hidden when it's unset, and it was missing in the dev build.
7. **Later.** Home-screen widget, holiday mode (pause reminders or hand them
   to a housemate for a date range), and identifying a plant from a photo.

---

## Found along the way

- (Emulator, 21 November 2026) The add-plant form's Save button stays
  behind the keyboard, and Back or Escape with the keyboard closed dismisses
  the whole form, losing what was typed. Close the keyboard with its ✓ key
  first. Worth a KeyboardAvoidingView and a "discard?" check.
- (Emulator) Catalogue plants such as `monstera-deliciosa` have no
  `scientific_name`, only `name` and `slug`. Search now matches on the name
  as well.
- (Emulator) The Profile Display Name field starts empty rather than
  showing the current name.

- ~~Invite join error message~~ Fixed: `invites.ts` uses the same text.
- ~~Profile "Saved" after a failed rename~~ Fixed: `update` returns whether it worked.
- `PlantCacheService.test.ts` prints a `console.warn` on a passing test; mock it
  there.
- After adding a plant the app opens its details straight away. If the
  household listener hasn't delivered the plant yet the screen briefly shows
  "Plant not found".
- ~~Rules tests picked up by Jest in a worktree~~ Fixed in `jest.config.js`.
- ~~The "Details unavailable offline" and "Will sync" notes~~ Built on `release-prep` (ported from the parallel branch).
- Rules tests for session E were written but not run: the emulator needs JDK 21 and this machine has 17.
- Session H dependency work (audit overrides, Expo 58 / RN 0.88 / RN Firebase 27) is left for its own session.

- Test data on the `test` account changed during QA on 17 November 2026:
  - "Watermelon" was deleted by a mis-tap and re-added, so its history is
    gone.
  - "Bedroom Snake Plant" was marked watered.
  - "ZZ Test Keep" was left in place on purpose.
- A throwaway account (credentials in `.env.local` as `E2E_EMAIL_B` and
  `E2E_PASSWORD_B`) exists in Firebase Auth. Keep it for the Maestro
  `invite-and-join` flow, or delete it in the console.
