# Household sharing (MVP plan)

Goal: housemates share one set of plants and split watering. Anyone in the
household can water any plant, and everyone can see who watered it last.
There's no assignment or rota.

Decisions made so far:

- **Model:** a household. Every plant in it is shared with every member.
- **Duties:** no assignment. Anyone can log watering, and the app shows who did it.
- **Joining:** handled in the database for now. There's no invite UI in the app.
- **Sync:** a live Firestore listener while the app is open, plus local reminders
  that are rescheduled when data changes. No push notifications.

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
  last_watered_by: uid | null
  last_watered_by_name: string | null   // denormalised, so cards need no lookup

Users/{uid}
  ...existing profile fields
  householdId: string
```

`IUserPlant.userId` stays for now so the existing code keeps compiling. New
writes set it to the person who added the plant (`addedBy`).

## Joining a household (done in the database)

1. On first sign-in, or the first load after this ships, the user gets a
   household of their own, `{ name: "<displayName>'s home", memberIds: [uid] }`,
   and `Users/{uid}.householdId` is set.
2. To add a housemate, in the Firebase console or with a small admin script:
   - add their uid to `memberIds`, and add them to `members` on the target household
   - set their `Users/{uid}.householdId` to that household
   - optionally move their old plants across (the migration script below can do this)
3. Profile shows the household ID, with a copy button, so it's easy to find in the console.

The UI for this can come later. Swapping it for an invite code would only add a
`joinHousehold(code)` Cloud Function. Nothing else in this plan changes.

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
  }
}
```

`Users/{uid}.householdId` can't be pointed at a household the user isn't in,
because every read and write still goes through `isMember`.

## Client changes

| Area | Change |
| --- | --- |
| `helpers/firebase/*UserPlant*`, `fetchUserPlants`, `getUserPlantData` | Change the path from `Users/{uid}/UserPlants` to `Households/{hid}/Plants`. Pass in `householdId` instead of `user.uid`. |
| New `context/household/HouseholdProvider` | Loads `Users/{uid}.householdId`, subscribes to the household doc, and creates a solo household if there's none. Exposes `{ household, members }`. |
| `hooks/plants/useUserPlants` | Swap the one-off `getDocs` for `onSnapshot` on the household's plants, dispatching `setUserPlants` on each change, so the list updates live. |
| `screens/PlantDetails` `handleLogWatering` | Also write `last_watered_by` and `last_watered_by_name`. |
| `services/NotificationService` | Call `syncAllWateringReminders` from the snapshot listener, so a housemate's watering moves or cancels your local reminder the next time the app is open. |
| `functions/index.js` `deleteAccount` | Anonymise and delete only plants where `addedBy == uid` *and* the user is the only member. Otherwise, remove the user from `memberIds`/`members` and leave the shared plants alone. |

## UI hooks already in place (from the redesign)

- `ScreenScrollView` has an `eyebrow` prop. Home currently passes `"Today"`;
  it switches to the household name.
- `PlantCard` has a "last watered" meta line from `formatLastWatered()`. Add a
  `by` argument to get "Watered 2 days ago by Sam".
- `WateringPrediction` builds its info rows from a list. Its "Last watered" row
  gets the name appended the same way.
- Profile has a sectioned layout with an `Account` card. A `Household` card
  (name, members, and household ID with a copy button) goes above it.

## Migration

The app is pre-release, so this is a one-off client-side migration, run once
per user when `HouseholdProvider` creates the solo household:

1. Copy every doc in `Users/{uid}/UserPlants` into `Households/{hid}/Plants`,
   adding `addedBy: uid`.
2. Mark the user doc as migrated (`plantsMigratedAt`) and keep the old
   collection for one release in case a rollback is needed.

Once nobody is on an old build, delete the old `Users/{uid}/UserPlants` rule
and data.

## Out of scope for the MVP

- Invite codes or links, leaving a household, or removing a member in the app
- Assigning plants or rotating turns
- Push notifications ("Sam watered the Monstera")
- A full watering history (only the last watering is stored for now)

## Rough order of work

1. Rules and the `HouseholdProvider` that creates solo households and runs the migration
2. Point the persistence helpers at the household path; switch to `onSnapshot`
3. Record `last_watered_by` and show it on the card, details screen and Home
4. Add the Household card to Profile
5. Update `deleteAccount` for shared households
6. Test with two accounts linked by hand in the console
