# Operations

Where to look when something breaks, which alerts exist, and how to get data
back. For releasing and rolling back, see `docs/RELEASE.md`.

## Where to look

| Symptom | Look here first |
| --- | --- |
| The app crashes or shows "Oops! Something went wrong" | Firebase console → Crashlytics. Crashes and handled errors ("non-fatals") are both there. |
| A reminder or "watered" push never arrived | Cloud Logging, the push queries below. |
| Search, join, leave or delete account fails | Cloud Logging, filtered by function. |
| A deploy didn't happen | GitHub → Actions → **Deploy on merge**. |
| The bill is climbing | Google Cloud → Billing → Reports, grouped by service. |

### Crashlytics

- Every report carries the Firebase uid of whoever was signed in (set on
  sign-in, cleared on sign-out). Search by uid under Crashlytics → Search by
  user. The uid is the only identifier sent: no email or name.
- Handled errors appear as **Non-fatals**. Each has a short context as its
  log line: `Save Plant`, `Log Watering`, `Plants listener`, `Profile
  listener`, `Household listener`, `Create household`, `Migrate plants`,
  `Fetch Trefle Plants`, `Join a household` and so on.
- Being offline is not reported. A failed call that only means "no
  connection" shows the person a message and is left out of Crashlytics, so
  the non-fatals list stays worth reading.

### Function logs

Firebase console → Functions → Logs, or Google Cloud → Logging → Logs
Explorer. Every line the functions write has a `fn` field with the function
name, and IDs and counts only: `uid`, `householdId`, `plantId`, how many.
Logs never hold an email, a display name, a plant's name, a search query, an
invite code or a push token. Keep it that way when adding a log line
(`functions/log.js`).

Useful queries for the Logs Explorer:

```
jsonPayload.fn="sendWateringReminders"
```

One `sendWateringReminders finished` line every 15 minutes, with `found`,
`due`, `nudge`, `cleared`, `skipped`, `failed` and `devices`. No line for
more than 15 minutes means the scheduler job isn't running (Google Cloud →
Cloud Scheduler). `failed` above 0 has a matching `Reminder failed` line
with the plant.

```
jsonPayload.fn="push"
```

- `Expo push request failed`: Expo's service refused the whole request
  (`status`).
- `Expo refused pushes`: Expo refused some devices straight away. `errors`
  counts them by Expo's code.
- `Push receipts had failures`: Expo accepted the push but the phone's push
  service didn't take it. This is the silent kind of failure. `errors`
  counts by code: `InvalidCredentials` or `MismatchSenderId` means the FCM
  credentials in the Expo project are wrong (expo.dev → the project →
  Credentials); `MessageRateExceeded` and `MessageTooBig` mean what they say.
- `DeviceNotRegistered` is routine (someone uninstalled the app). It is
  logged at info level and the device is removed.

```
jsonPayload.fn="joinHousehold"
severity>=ERROR
```

Each callable logs `<name> finished` on success, `<name> refused` (a
warning, with the error `code`) when it turned the caller down for an
expected reason such as a wrong invite code, and `<name> failed` (an error)
when something unexpected broke. Only the last kind should set off an alert.

### How push delivery is checked

`sendToUsers` (`functions/push.js`) saves each push Expo accepts as
`PushTickets/{ticketId}` with the device's path and the time. Each
`sendWateringReminders` run then asks Expo for the receipts of tickets older
than 15 minutes, logs the failures, removes dead devices and deletes the
tickets it checked. A ticket with no receipt after a day is dropped. The
collection is closed to the app and normally holds only the last few
minutes of pushes.

## Alerts

These are set up by hand in the consoles (see **Kian does** under session 8
in `docs/production-readiness-plan.md`). Tick each one here when it exists.

- [ ] **Crashlytics email alerts.** Firebase console → Project settings →
      Integrations/Alerts → Crashlytics: new fatal issues, regressed issues
      and velocity alerts, by email.
- [ ] **Function errors.** Google Cloud → Monitoring → Alerting → create a
      log-based alert on
      `resource.type="cloud_function" severity>=ERROR`, notifying by email,
      at most one notification every 30 minutes. This catches a thrown error
      in any function and the `Push receipts had failures` line.
- [ ] **Reminders stopped.** Optional: a log-based metric counting
      `jsonPayload.fn="sendWateringReminders"` lines with message
      `sendWateringReminders finished`, and an alert when it is absent for an
      hour.
- [ ] **Billing budget.** Google Cloud → Billing → Budgets & alerts: a
      monthly budget with email at 50%, 90% and 100%. A budget only warns; it
      does not stop spending. `maxInstances` on every function and the rate
      limits in `functions/guards.js` are what cap the cost.

To check the function alert works, throw once on purpose. On a branch, make
`searchPlants` throw a plain `Error` at its first line, run **Deploy Cloud
Functions** for `searchPlants` from that branch, search for anything in the
app and wait for the email. Then run the workflow again from `main` to put
the real function back. (A wrong invite code won't do: expected refusals are
logged as warnings, not errors.)

## Backups

Firestore holds everything worth keeping: users, households, plants, the
catalog. Auth accounts are not in the backup, but they can't be lost by a
bad deploy or a bad rule.

### Set up (once)

In Google Cloud Shell, with the project selected:

```bash
gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=7d
```

```bash
gcloud firestore backups schedules list --database='(default)'
```

Backups are kept in the database's own region and are billed for the
storage they use.

### Restore

A restore never overwrites the live database. It creates a new database
from a backup, which you then read from.

1. Find the backup:

   ```bash
   gcloud firestore backups list
   ```

2. Restore it into a new database (the name must not exist yet):

   ```bash
   gcloud firestore databases restore --source-backup=projects/PROJECT_ID/locations/LOCATION/backups/BACKUP_ID --destination-database='restore-check'
   ```

   This takes a few minutes. Follow it with
   `gcloud firestore operations list --database='restore-check'`.

3. Open the restored database in the Firebase console (Firestore → the
   database picker at the top) and check the data is what you expect.

4. Getting data back into the live database depends on what was lost:
   - **A few documents** (one household's plants, say): copy them across by
     hand in the console, or with a short Admin SDK script that reads from
     `getFirestore(app, "restore-check")` and writes to the default database.
   - **Everything**: there is no in-place restore. Export the restored
     database to a Cloud Storage bucket and import it into `(default)`
     (`gcloud firestore export` then `gcloud firestore import`). An import
     overwrites documents with the same ID and leaves others alone. Ask the
     testers to stay out of the app while it runs.

5. Delete the restored database when done, or it keeps costing money:

   ```bash
   gcloud firestore databases delete --database='restore-check'
   ```

Do steps 1 to 3 and 5 once now, to prove a restore works, and note the date
here: **Restore last tested:** not yet.

## Things that clean up after themselves

- `RateLimits` and `Invites` documents have an `expiresAt`. They are removed
  by Firestore TTL policies once those are added (two-phone checkpoint in the
  plan). Until then they pile up harmlessly.
- `PushTickets` are deleted by the receipt check, as above.
- Push tokens Expo reports as `DeviceNotRegistered` are deleted from
  `Users/{uid}/Devices`.
