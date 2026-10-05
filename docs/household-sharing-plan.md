# Household sharing (MVP plan)

Goal: housemates share plant care, so nobody waters twice and nothing gets
forgotten. This is the app's main selling point. Two things make it work:

1. **"Already done" notifications.** If I water your plant, you get a push
   saying so ("Kian watered your Monstera 💧 No need to water it"), and your
   reminder for it goes away.
2. **Shared reminders.** If a shared plant is due and nobody has watered it,
   everyone who looks after it gets the reminder. Once one of us waters it,
   the others are told it's done.

Decisions made so far:

- **Model:** a household. Everyone in it can see and water every plant in it.
  Each plant also has **carers**: the people who get its reminders and hear
  when someone else waters it. A plant with one carer is someone's own plant.
  A plant whose carers are the whole household is a shared plant.
- **Duties:** no assignment or rota. Anyone can log watering, and the app shows who did it.
- **Joining:** handled in the database for now. There's no invite UI in the app.
- **Notifications:** **push**, sent by Cloud Functions. Watering reminders move
  from on-device scheduling to the server. A local reminder can't know that a
  housemate already watered the plant, which is the exact case we're selling.
- **Sync:** a live Firestore listener while the app is open.
- **Leaving:** when a member deletes their account, the household keeps its
  plants. Plants only they looked after become shared with whoever is left.

**Status:** not started. Build it one phase at a time (see **Phases**). A
first pass at all six phases is in closed PR #59, and each phase's code can be
taken from there.

## Data model

```
Households/{householdId}
  name: string                       // "The Flat"
  memberIds: string[]                // uids, used by the security rules
  members: { [uid]: { displayName: string } }   // shown in the UI; avoids reading other users' profiles
  createdBy: uid
  createdAt: timestamp
  timeZone: string                   // IANA, e.g. "Europe/London"; used for quiet hours

Households/{householdId}/Plants/{userPlantId}
  ...IUserPlant fields (unchanged)
  addedBy: uid                       // replaces userId as "who created it"
  carerIds: uid[]                    // who gets reminders and "watered" pushes; [addedBy] by default
  last_watered_by: uid | null
  last_watered_by_name: string | null   // denormalised, so cards and pushes need no lookup
  notify_at: number | null           // when the next push is due (quiet hours applied); server-only
  notify_stage: "due" | "nudge" | null   // which push notify_at is for; server-only

Users/{uid}
  ...existing profile fields
  householdId: string
  timeZone: string                   // IANA; the device's zone, copied to a new household
  notificationPrefs: { reminders: boolean, housemateActivity: boolean }   // both default true

Users/{uid}/Devices/{expoPushToken}   // the token is the doc ID, so re-registering is idempotent
  expoPushToken: string
  platform: "ios" | "android"
  updatedAt: timestamp
```

`IUserPlant.userId` stays for now so the existing code keeps compiling. New
writes set it to the person who added the plant (`addedBy`).

**Shared or personal?** When you add a plant, a "Shared with the household"
toggle sets `carerIds` to all `memberIds` (on) or to `[you]` (off, the
default). It can be changed later on the plant's details screen. When a
member joins, they're added to `carerIds` on plants already marked shared, so
we also store `shared: boolean` on the plant to tell the two apart.

## Notifications

All pushes go through the Expo push service. The project already has an EAS
`projectId`, and `expo-notifications` is installed, so the client only needs
`getExpoPushTokenAsync()`. APNs and FCM credentials are uploaded to EAS once.

### 1. "Already watered" (Firestore trigger)

`onPlantWritten`: `functions.firestore.document("Households/{hid}/Plants/{pid}").onWrite`. It
sends this push when `last_watered_date` changes. The same trigger also plans
the next reminder (see 2).

- Recipients: `carerIds` minus `last_watered_by`, filtered by
  `notificationPrefs.housemateActivity`.
- Your own plant, watered by a housemate:
  **"Sam watered your Monstera 💧"** / "No need to water it. Next due Thu."
- A shared plant: **"Sam watered the Monstera 💧"** / "No need to water it. Next due Thu."
- Nothing is sent when you water a plant only you look after, or when the
  change is an edit rather than a watering (`last_watered_date` unchanged).
- Tapping it opens the plant (`data: { plantId, householdId }`, handled with
  the existing `plantfriends://` scheme).

### 2. "Time to water" and "Still thirsty" (scheduled)

Planning: whenever `next_watering_date` or `reminders_enabled` changes,
`onPlantWritten` sets `notify_at` to the due time moved out of quiet hours, and
sets `notify_stage: "due"`. If reminders are off, it sets both to null.

`sendWateringReminders`: `functions.pubsub.schedule("every 15 minutes")`. It runs a
collection-group query on `Plants` where `notify_at <= now`. That returns
exactly the plants that need a push now, rather than every overdue plant.

- **Due reminder** (`notify_stage == "due"`): push to every carer, then set
  `notify_stage: "nudge"` and `notify_at` to 24 hours after the due time (moved out of quiet hours).
  - Personal plant: "Time to water the Monstera 💧"
  - Shared plant: "The Monstera needs watering 💧" / "Whoever gets there first, tap Watered."
- **Nudge** (`notify_stage == "nudge"`): one follow-up, "The Monstera is still
  thirsty", then set both fields to null. After that we stop, so nobody gets nagged.
- **Sensible hours:** nothing goes out between 21:00 and 08:00 in the
  household's `timeZone`. A reminder that falls due overnight waits until 08:00.
  The quiet-hours maths lives in a pure, tested `functions/notifyAt.js`.
- Watering writes a new `next_watering_date`, so `onPlantWritten` plans a fresh
  `notify_at` and the next cycle starts clean.
- The scheduler's update uses a `lastUpdateTime` precondition. If someone
  watered the plant while it was sending, the fresh plan isn't overwritten.
- `reminders_enabled === false` on the plant, or `notificationPrefs.reminders`
  off for a user, skips it.

This needs a collection-group index on `Plants.notify_at`. Add it to
`firestore.indexes.json` and reference that file from `firebase.json`. A
collection-group query on `Plants` also covers the top-level `/Plants` catalog.
Catalog docs have no `notify_at`, so they never match, but renaming the
subcollection to `HouseholdPlants` before release would make this clearer.

### 3. "It's done" after a shared reminder

This comes from (1) for free. Once a shared plant's reminder has gone out,
the first person to water it triggers `onPlantWritten`, and every other carer
gets "Sam watered the Monstera". The client can also call
`dismissNotificationAsync` on any delivered reminder for that plant
(identified by `data.plantId`) when the snapshot listener sees the watering,
so the stale "needs watering" banner disappears from the notification centre.

### Sending helper

`functions/push.js`:

- `sendToUsers(uids, message)` reads `Users/{uid}/Devices`, applies
  preferences, and sends to `https://exp.host/--/api/v2/push/send` in batches of up to 100.
- It reads the push receipts and deletes `Devices` docs that return
  `DeviceNotRegistered`.
- Firestore and `fetch` are passed in, so it's unit tested with fakes.

### Client side

- On sign-in (and when the token changes), request permission, get the Expo push
  token, and upsert `Users/{uid}/Devices/{token}`. Write `timeZone` from
  `Intl.DateTimeFormat().resolvedOptions().timeZone`. On sign-out, delete the device doc.
- Remove local scheduling from `NotificationService` for household plants.
  Keep the permission request, the foreground handler, and a response listener
  that routes taps to the plant. Cancel any previously scheduled local
  reminders once on upgrade, so people don't get duplicates.
- Ask for notification permission at the moment it's useful (after adding the
  first plant: "Get a nudge when it's thirsty, and know when your housemate's
  already watered it"), not on first launch.

## Joining a household (done in the database)

1. On first sign-in, or the first load after this ships, the user gets a
   household of their own, `{ name: "<displayName>'s home", memberIds: [uid] }`,
   and `Users/{uid}.householdId` is set. Its ID is the user's uid, so two
   devices setting up at once can't create two households.
2. To add a housemate, in the Firebase console or with a small admin script:
   - add their uid to `memberIds`, and add them to `members` on the target household
   - set their `Users/{uid}.householdId` to that household
   - add their uid to `carerIds` on every plant where `shared == true`
   - optionally move their old plants across (the migration script below can do this)
3. Profile shows the household ID (selectable, with a Share button), so it's easy to find in the console.
4. The app follows `Users/{uid}.householdId` live, so the housemate's app
   switches to the shared household without signing out.

The UI for this can come later. Swapping it for an invite code would only add a
`joinHousehold(code)` Cloud Function that does step 2. Nothing else in this plan changes.

## Firestore rules

The rules are in `firestore.rules`. In short:

- **Households:** members can read and rename one. Anyone can create a
  household whose ID is their own uid, with only themselves as a member.
  Nobody can add or remove members from the app, and nobody can delete one.
- **Plants:** members can read, add, edit and delete. A new plant must be
  added by you, and every carer must be a member. `addedBy`, `notify_at` and
  `notify_stage` can't be changed from the app.
- **Devices:** you can only read and write your own.

Create, update and delete are separate rules on purpose. Rules that allow a
write are OR'd together, so a blanket `allow write` would cancel the update
restriction. Cloud Functions use the Admin SDK, so they bypass the rules.

## UI hooks already in place (from the redesign)

- `ScreenScrollView` has an `eyebrow` prop. Home currently passes `"Today"`;
  it switches to the household name.
- `PlantCard` has a "last watered" meta line from `formatLastWatered()`. Add a
  `by` argument to get "Watered 2 days ago by Sam". Shared plants get a small
  "Shared" badge, and a housemate's personal plant shows "Sam's".
- `WateringPrediction` builds its info rows from a list. Its "Last watered" row
  gets the name appended the same way.
- Profile has a sectioned layout with an `Account` card. A `Household` card
  (name, members, and household ID with a Share button) goes above it.

## Migration

The app is pre-release, so this is a one-off client-side migration, run once
per user when `HouseholdProvider` creates the solo household:

1. Copy every doc in `Users/{uid}/UserPlants` into `Households/{hid}/Plants`,
   adding `addedBy: uid`, `carerIds: [uid]` and `shared: false`.
2. Mark the user doc as migrated (`plantsMigratedAt`) and keep the old
   collection for one release in case a rollback is needed.
3. Cancel all locally scheduled reminders. The server takes over from here.

Once nobody is on an old build, delete the old `Users/{uid}/UserPlants` rule
and data.

## Out of scope for the MVP

- Invite codes or links, leaving a household, or removing a member in the app
- Assigning plants or rotating turns
- A full watering history (only the last watering is stored for now)
- Batching several due plants into one push ("3 plants need water"). Worth
  doing soon after, once people have more than a handful of plants.
- Offline fallback reminders. If the device can't reach the server, there's no push.

## Phases

Each phase can ship on its own, and the app keeps working after every one. Do
them in order. Every phase lists the code, what you do yourself, how to check
it, and when it's done.

To link two accounts by hand (needed from phase 2), see **Joining a
household** above.

### Phase 1: Households underneath

Plants move into a household. Nothing looks different yet, except that Home
shows the household name.

- **Code:** `HouseholdProvider`, `setupHousehold.ts` (the solo household and
  the migration), `householdPaths.ts`, and household paths in the save,
  remove and lookup helpers. Home and My Plants use the live listener.
  `firestore.rules`.
- **You do:**
  1. `firebase deploy --only firestore:rules`
  2. Install a build on your phone and open the app.
- **Check:**
  - In the console, `Households/{your uid}` exists and its `Plants` hold your plants.
  - `Users/{your uid}` has `householdId` and `plantsMigratedAt`.
  - Adding and deleting a plant still works.
- **Done when:** your existing plants show up and nothing else has changed.

### Phase 2: See who watered

Two accounts share one household, and each can see who watered what.

- **Code:** `logWatering()` (writes only the watering fields), the
  ownership fixes in `saveUserPlantToFirebase` and `getUserPlantData`, "by
  Sam" on the card and details screen, Shared and "Sam's" badges, and the
  "Shared with the household" switch (`setPlantSharing`, `SwitchField`).
- **You do:**
  1. Sign up a second account on another phone, or ask your housemate.
  2. Link it to your household in the console.
- **Check:**
  - Their app shows your plants without signing out.
  - Water one of your plants on their phone. Yours shows "Watered today by
    Sam" within a few seconds, and the plant is still yours.
  - Share a plant, and its Shared badge appears on both phones.
- **Done when:** both phones show the same plants and who watered each one.

### Phase 3: Push plumbing

Phones can receive pushes. Nothing sends real ones yet.

- **Code:** `PushRegistration.ts` (token stored in `Users/{uid}/Devices`;
  permission asked after adding or watering a plant; removed on sign-out),
  notification taps open the plant (`App.tsx`), and `functions/push.js`.
- **You do:**
  1. `eas credentials`: upload an APNs key (iOS) and an FCM V1 service
     account key (Android).
  2. Make a new build. Push needs a real device.
- **Check:**
  - After you water a plant and allow notifications, a doc appears under
    `Users/{uid}/Devices`.
  - Send a test push to that token from expo.dev/notifications, with data
    `{ "plantId": "<a plant id>" }`. It arrives, and tapping it opens the plant.
  - Signing out removes the device doc.
- **Done when:** a test push reaches both phones and opens the right plant.

### Phase 4: "Already watered" (the selling point)

- **Code:** the watering half of `onPlantWritten`, `wateredMessages` in
  `plantMessages.js`, and the "When a housemate waters my plants" switch on
  Profile.
- **You do:** `firebase deploy --only functions:onPlantWritten`
- **Check:**
  - A waters B's plant: B gets "A watered your Monstera 💧 No need to water
    it. Next due …". A gets nothing.
  - A waters a shared plant: B gets "A watered the Monstera 💧".
  - A waters a plant only A looks after: nobody is notified.
  - B turns the switch off, and A's next watering sends B nothing.
- **Done when:** all four behave as above on two phones.

### Phase 5: Reminders from the server

Reminders move off the phone, so they know about a housemate's watering.

- **Code:** reminder planning in `onPlantWritten` (`notify_at` /
  `notify_stage`), `sendWateringReminders`, quiet hours (`notifyAt.js`), the
  `notify_at` index, clearing stale reminders from the tray, and the
  "Watering reminders" switch. Removes on-device reminder scheduling, and
  cancels old local reminders once.
- **You do:**
  1. Turn on the Cloud Scheduler API for the Firebase project (Blaze plan).
  2. `firebase deploy --only firestore:indexes`, then
     `firebase deploy --only functions`.
- **Check:**
  - In the console, set a shared plant's `next_watering_date` to a few
    minutes from now (daytime). Within 15 minutes of that time, both phones
    get "The Monstera needs watering". One of you waters it, the other gets
    "watered", the reminder disappears from their tray, and there's no
    nudge the next day.
  - Leave one unwatered. One "still thirsty" nudge comes a day later, then
    nothing more.
  - A due time of 02:30 gives a `notify_at` of 08:00 in the household's time zone.
- **Done when:** reminders arrive once, at sensible hours, and stop when
  someone waters the plant.

### Phase 6: Profile and leaving

- **Code:** the Household card on Profile (name, members, and a shareable
  household ID), and `deleteAccount` for shared households.
- **You do:** `firebase deploy --only functions:deleteAccount`
- **Check:**
  - Profile shows the household and both members.
  - Delete the second account. You stay in the household with every plant.
    Plants only they looked after are now shared with you, and their name is
    gone from "watered by".
- **Done when:** a housemate can leave without losing any plants.
