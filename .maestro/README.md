# End-to-end flows (Maestro)

Flows run against a **preview** build (`pnpm`-free: install the APK from the
**Build Android test app** workflow) and a real Firebase test account.

Never use a real person's account. Create two throwaway email/password
accounts in the Firebase console (Authentication) and keep them out of the repo.

```bash
# once: https://maestro.mobile.dev/getting-started/installing-maestro
adb install plantfriends-preview.apk

maestro test \
  -e APP_ID=com.thekian.plantfriends \
  -e E2E_EMAIL=you+a@example.com -e E2E_PASSWORD=... \
  .maestro/add-and-water-plant.yaml

maestro test \
  -e APP_ID=com.thekian.plantfriends \
  -e E2E_EMAIL=you+a@example.com -e E2E_PASSWORD=... \
  -e E2E_EMAIL_B=you+b@example.com -e E2E_PASSWORD_B=... \
  .maestro/invite-and-join.yaml
```

## Flows

- `add-and-water-plant.yaml`: sign in, add a plant, log its first watering,
  check the card shows "Last watered", sign out.
- `invite-and-join.yaml`: account A creates an invite, account B joins with
  the code. The invite code is shown only in the system share sheet, so the
  flow stops at the confirmation prompt; finish the join by hand with the
  two-phone script (`docs/TEST_SCRIPT.md`).

## Why these don't run in CI

GitHub's hosted emulators need hardware acceleration, take 20 to 30 minutes
to build the app first, and need real test-account credentials as secrets.
For three testers that costs more than it saves. Run the flows locally
before a release (`docs/RELEASE.md`). If CI is wanted later, run
`maestro test` with `reactivecircus/android-emulator-runner` against the APK
from **Build Android test app**, with the E2E variables held as secrets.
