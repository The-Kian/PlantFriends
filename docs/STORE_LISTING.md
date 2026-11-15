# Store listing

Copy-paste text and answers for Google Play Console and App Store Connect.
Graphics are in `assets/store/` (regenerate with `node assets/icon-source/store.js`).

## Basics

| Field | Value |
| --- | --- |
| App name | Plant Friends |
| Apple subtitle (30) | Plant care for the household |
| Category | Lifestyle (Apple: secondary category Utilities) |
| Price | Free, no in-app purchases, no ads |
| Support URL | https://plantfriends-31bcc.web.app |
| Privacy policy URL | https://plantfriends-31bcc.web.app/privacy |
| Support / contact email | kian.popat@gmail.com |
| Copyright (Apple) | 2026 Kian Popat |

## Short description (Play, 80 characters max)

Share plant care with your household and get a reminder when plants need water.

## Apple promotional text (170 max)

Never wonder "did I water that?" again. Share your plants with housemates, see who watered what, and get a reminder when it's time.

## Apple keywords (100 max, comma-separated, no spaces)

plants,watering,reminder,houseplant,plant care,garden,succulent,water tracker,indoor plants,monstera

## Full description (Play 4000 max / Apple description)

Plant Friends keeps your houseplants happy by remembering when each one needs water, so you don't have to. Look after them together: invite the people you live with and share the job.

SHARE WITH YOUR HOUSEHOLD
Invite housemates with a short code. Plants can be shared with everyone or kept as your own. Each plant shows who watered it last, and you can get a nudge when a housemate waters one of yours. Anyone can leave a household at any time.

ADD YOUR PLANTS
Search for a plant by name to pull in its care details, such as light, watering and toxicity, then give it a nickname and note where it lives in your home.

WATERING THAT FITS EACH PLANT
Every plant gets its own watering schedule. Use the suggested one or set your own. When you water a plant, tap once and Plant Friends works out when it's next due.

REMINDERS THAT ARRIVE ON TIME
Get a notification on the day a plant needs watering, and a gentle nudge a day later if it's still thirsty. Reminders come from our server and are never sent between 21:00 and 08:00. You can turn watering reminders and housemate activity off separately in Profile.

SEE WHAT NEEDS ATTENTION
The home screen shows which plants are overdue, which are due soon and which are fine, so you can water the right ones first.

MADE TO BE CALM
A clean, natural design with light and dark modes. No ads, no tracking.

YOUR DATA
Sign in with email, Google or Apple. Your plants sync to your account. You can delete your account and data at any time from the Profile screen.

## Reviewer access (both stores)

Use the reviewer account: email `kian.popat+plantfriends-review@gmail.com`; the password is kept outside the repo (see your notes).
The account already has six plants, some due for watering today.

Review notes:

> Sign in with the email and password above. The account has plants already
> added. Watering reminders are push notifications sent by our server, so
> allow notifications when asked. Household invites and leaving are under
> Profile → Household. Account deletion is under Profile → Delete account.

## Screenshots to take

Take these on a phone, signed in as the reviewer account, in light mode:

1. Home: plants that need watering today
2. My Plants: the full collection
3. Plant search: results for "monstera"
4. Plant details: care info and the watering prediction
5. Adding or customising a plant (name, location, schedule)
6. A watering reminder notification (optional)

Sizes:
- **Play:** 2–8 phone screenshots, 16:9 or 9:16, each side 320–3840 px. A modern Android phone's screenshots are fine as they are.
- **Apple:** 6.9" iPhone, 1320 × 2868 portrait (an iPhone 16/17 Pro Max). Apple scales these down for smaller iPhones. No iPad screenshots are needed, because the app is iPhone-only (`supportsTablet: false`).

## Google Play: Data safety answers

- Does the app collect or share user data? **Yes, collects.** It is **not shared** with third parties for their own use; other household members you invite see your display name and watering activity, which is in-app functionality you control. Expo's push service and Google Firebase process data on our behalf.
- Is all data encrypted in transit? **Yes.**
- Can users request deletion? **Yes**, in the app (Profile → Delete account) and by email.
- Data collected:
  - **Personal info → Email address, Name:** collected, required, for App functionality and Account management.
  - **App activity → Other user-generated content** (plants, notes, watering history, who watered what): collected, required, for App functionality. Visible to the other members of a household you join.
  - **Device or other IDs → Push notification token:** collected, required, for App functionality (reminders and housemate notifications). Sent to Expo's push service to deliver messages; this is service-provider processing, not sharing.
  - **Location → Approximate:** not collected. Only the phone's **time zone setting** is stored, to avoid night-time reminders.
  - **App info and performance → Crash logs, Diagnostics:** collected, required, for Analytics (crash reporting).
  - **Device or other IDs:** collected (Crashlytics installation ID), for Analytics.
- None of it is used for advertising or shared with third parties.

Other App content answers: no ads; content rating questionnaire, answer **No** to everything (Utility/Productivity category); target audience **13+**; app access: **some functionality is restricted**, use the reviewer login above; not a news, government, financial or health app.

## Apple: App Privacy answers

Data types (add Device ID for the push token), all **linked to the user**, **not used for tracking**:

- **Contact Info → Email Address, Name:** App Functionality.
- **User Content → Other User Content:** App Functionality.
- **Identifiers → User ID, Device ID (push token):** App Functionality.
- **Diagnostics → Crash Data:** App Functionality.

Age rating: answer **None** to everything, which gives 4+.
Export compliance: already answered in the app config (no non-exempt encryption).
