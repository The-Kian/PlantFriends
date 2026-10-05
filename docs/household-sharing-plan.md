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

## Data model

```
Households/{householdId}
  name: string                       // "The Flat"
  memberIds: string[]                // uids, used by the security rules
  members: { [uid]: { displayName: string } }   // shown in the UI; avoids reading other users' profiles
  createdBy: uid
  createdAt: timestamp

Households/{householdId}/Plants/{userPlantId}
  ...IUserPlant fields (unchanged)
  addedBy: uid                       // replaces userId as "who created it"
  carerIds: uid[]                    // who gets reminders and "watered" pushes; [addedBy] by default
  last_watered_by: uid | null
  last_watered_by_name: string | null   // denormalised, so cards and pushes need no lookup
  reminder_sent_for: number | null   // the next_watering_date the last reminder was sent for
  nudge_sent_for: number | null      // the same, for the "still thirsty" follow-up

Users/{uid}
  ...existing profile fields
  householdId: string
  timeZone: string                   // IANA, e.g. "Europe/London"; for sending at sensible hours
  notificationPrefs: { reminders: boolean, housemateActivity: boolean }   // both default true

Users/{uid}/Devices/{installationId}
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

`onPlantWatered`: `onDocumentUpdated("Households/{hid}/Plants/{pid}")`. It
fires when `last_watered_date` changes.

- Recipients: `carerIds` minus `last_watered_by`, filtered by
  `notificationPrefs.housemateActivity`.
- Your own plant, watered by a housemate:
  **"Sam watered your Monstera 💧"** / "No need to water it. Next due Thu."
- A shared plant: **"Sam watered the Monstera 💧"** / "It's sorted for this week."
- Nothing is sent when you water a plant only you look after, or when the
  change is an edit rather than a watering (`last_watered_date` unchanged).
- Tapping it opens the plant (`data: { plantId, householdId }`, handled with
  the existing `plantfriends://` scheme).

### 2. "Time to water" and "Still thirsty" (scheduled)

`sendWateringReminders`: `onSchedule("every 15 minutes")`. It runs a
collection-group query on `Plants` where `next_watering_date <= now`.

- **Due reminder:** if `reminder_sent_for != next_watering_date`, push to every
  carer, then set `reminder_sent_for`.
  - Personal plant: "Time to water the Monstera 💧"
  - Shared plant: "The Monstera needs watering 💧" / "Whoever gets there first, tap Watered."
- **Nudge:** if it's still unwatered 24 hours after it was due, and
  `nudge_sent_for != next_watering_date`, send one follow-up:
  "The Monstera is still thirsty". After that we stop, so nobody gets nagged.
- **Sensible hours:** a reminder that falls due overnight waits until 08:00 in
  the recipient's `timeZone`. Each recipient is checked separately, so
  housemates in different time zones are each handled correctly. Nothing goes
  out between 21:00 and 08:00.
- Watering writes a new `next_watering_date`, so the `*_sent_for` markers stop
  matching on their own and the next cycle starts clean. Nothing needs resetting.
- `reminders_enabled === false` on the plant, or `notificationPrefs.reminders`
  off for a user, skips it.

This needs a composite index for the collection-group query on
`next_watering_date`. Add it to `firestore.indexes.json`.

### 3. "It's done" after a shared reminder

This comes from (1) for free. Once a shared plant's reminder has gone out,
the first person to water it triggers `onPlantWatered`, and every other carer
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
- It's a pure function of (recipients, prefs, plant), so it can be unit tested
  like `anonymise.js`.

### Client side

- On sign-in (and when the token changes), request permission, get the Expo push
  token, and upsert `Users/{uid}/Devices/{installationId}`. Write `timeZone` from
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
   and `Users/{uid}.householdId` is set.
2. To add a housemate, in the Firebase console or with a small admin script:
   - add their uid to `memberIds`, and add them to `members` on the target household
   - set their `Users/{uid}.householdId` to that household
   - add their uid to `carerIds` on every plant where `shared == true`
   - optionally move their old plants across (the migration script below can do this)
3. Profile shows the household ID, with a copy button, so it's easy to find in the console.

The UI for this can come later. Swapping it for an invite code would only add a
`joinHousehold(code)` Cloud Function that does step 2. Nothing else in this plan changes.

## Firestore rules

```
function isMember(hid) {
  return request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/Households/$(hid)).data.memberIds;
}

match /Households/{hid} {
  allow read: if isMember(hid);
  // Creating your own solo household is allowed; membership changes are admin-only for now.
  allow create: if request.auth != null
    && request.resource.data.memberIds == [request.auth.uid];
  allow update: if isMember(hid)
    && request.resource.data.memberIds == resource.data.memberIds;   // can rename, can't add people
  allow delete: if false;

  match /Plants/{plantId} {
    allow read, write: if isMember(hid);
    // Notification bookkeeping is server-only.
    allow update: if isMember(hid)
      && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(['reminder_sent_for', 'nudge_sent_for']);
  }
}

match /Users/{uid}/Devices/{deviceId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

(The final rules split `write` into create, update and delete, so the update
condition above actually applies. Rules are OR'd, so a blanket `write` would
override it.)

`Users/{uid}.householdId` can't be pointed at a household the user isn't in,
because every read and write still goes through `isMember`. Cloud Functions use
the Admin SDK, so they bypass the rules.

## Client changes

| Area | Change |
| --- | --- |
| `helpers/firebase/*UserPlant*`, `fetchUserPlants`, `getUserPlantData` | Change the path from `Users/{uid}/UserPlants` to `Households/{hid}/Plants`. Pass in `householdId` instead of `user.uid`. |
| New `context/household/HouseholdProvider` | Loads `Users/{uid}.householdId`, subscribes to the household doc, and creates a solo household if there's none. Exposes `{ household, members }`. |
| `hooks/plants/useUserPlants` | Swap the one-off `getDocs` for `onSnapshot` on the household's plants, dispatching `setUserPlants` on each change, so the list updates live. |
| `screens/PlantDetails` `handleLogWatering` | Also write `last_watered_by` and `last_watered_by_name`. |
| Add plant / `PlantDetails` | Add a "Shared with the household" toggle, which sets `shared` and `carerIds`. |
| `services/NotificationService` | Switch to push: register tokens, handle taps, dismiss stale reminders. Remove local scheduling. |
| New `functions/push.js`, `onPlantWatered`, `sendWateringReminders` | See **Notifications**. |
| `functions/index.js` `deleteAccount` | Delete the user's `Devices`. Anonymise and delete only plants where `addedBy == uid` *and* the user is the only member. Otherwise, remove the user from `memberIds`/`members` and from every plant's `carerIds`, and leave the shared plants alone. |
| Profile | Add notification toggles: "Watering reminders" and "When a housemate waters my plants". |

## UI hooks already in place (from the redesign)

- `ScreenScrollView` has an `eyebrow` prop. Home currently passes `"Today"`;
  it switches to the household name.
- `PlantCard` has a "last watered" meta line from `formatLastWatered()`. Add a
  `by` argument to get "Watered 2 days ago by Sam". Shared plants get a small
  "Shared" badge, and a housemate's personal plant shows "Sam's".
- `WateringPrediction` builds its info rows from a list. Its "Last watered" row
  gets the name appended the same way.
- Profile has a sectioned layout with an `Account` card. A `Household` card
  (name, members, and household ID with a copy button) goes above it.

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

## Rough order of work

1. Rules and the `HouseholdProvider` that creates solo households and runs the migration
2. Point the persistence helpers at the household path; switch to `onSnapshot`
3. Record `last_watered_by`, add `carerIds`/`shared` and the share toggle, and show who watered on the card, details screen and Home
4. Push plumbing: EAS credentials, token registration, `functions/push.js` with tests
5. `onPlantWatered`, the "already watered" push. **This is the USP, so ship and test it first.**
6. `sendWateringReminders` with quiet hours and the nudge; remove local scheduling
7. Profile: Household card and notification toggles
8. Update `deleteAccount` for shared households and devices
9. Test with two accounts on two physical devices, linked by hand in the console:
   - A waters B's plant → B gets "already watered", A gets nothing
   - A shared plant falls due → both get it; A waters → B gets "done", no nudge the next day
   - A due time overnight → the reminder arrives at 08:00
