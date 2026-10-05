# Store listing

Copy-paste text and answers for Google Play Console and App Store Connect.
Graphics are in `assets/store/` (regenerate with `node assets/icon-source/store.js`).

## Basics

| Field | Value |
| --- | --- |
| App name | Plant Friends |
| Apple subtitle (30) | Watering reminders for plants |
| Category | Lifestyle (Apple: secondary category Utilities) |
| Price | Free, no in-app purchases, no ads |
| Support URL | https://plantfriends-31bcc.web.app |
| Privacy policy URL | https://plantfriends-31bcc.web.app/privacy |
| Support / contact email | kian.popat@gmail.com |
| Copyright (Apple) | 2026 Kian Popat |

## Short description (Play, 80 characters max)

Track your houseplants and get a reminder when each one needs watering.

## Apple promotional text (170 max)

Never wonder "did I water that?" again. Add your plants, set how often each needs water, and Plant Friends reminds you when it's time.

## Apple keywords (100 max, comma-separated, no spaces)

plants,watering,reminder,houseplant,plant care,garden,succulent,water tracker,indoor plants,monstera

## Full description (Play 4000 max / Apple description)

Plant Friends keeps your houseplants happy by remembering when each one needs water, so you don't have to.

ADD YOUR PLANTS
Search for a plant by name to pull in its care details, such as light, watering and toxicity, then give it a nickname and note where it lives in your home.

WATERING THAT FITS EACH PLANT
Every plant gets its own watering schedule. Use the suggested one or set your own. When you water a plant, tap once and Plant Friends works out when it's next due.

REMINDERS THAT ARRIVE ON TIME
Get a notification on the day a plant needs watering. Reminders are scheduled on your phone, so they arrive even when you're offline.

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
> added. Watering reminders are local notifications scheduled on the device,
> so allow notifications when asked. Account deletion is under Profile →
> Delete account.

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

- Does the app collect or share user data? **Yes, collects; does not share.**
- Is all data encrypted in transit? **Yes.**
- Can users request deletion? **Yes**, in the app (Profile → Delete account) and by email.
- Data collected:
  - **Personal info → Email address, Name:** collected, required, for App functionality and Account management.
  - **App activity → Other user-generated content** (plants, notes, watering history): collected, required, for App functionality.
  - **App info and performance → Crash logs, Diagnostics:** collected, required, for Analytics (crash reporting).
  - **Device or other IDs:** collected (Crashlytics installation ID), for Analytics.
- None of it is used for advertising or shared with third parties.

Other App content answers: no ads; content rating questionnaire, answer **No** to everything (Utility/Productivity category); target audience **13+**; app access: **some functionality is restricted**, use the reviewer login above; not a news, government, financial or health app.

## Apple: App Privacy answers

Data types, all **linked to the user**, **not used for tracking**:

- **Contact Info → Email Address, Name:** App Functionality.
- **User Content → Other User Content:** App Functionality.
- **Identifiers → User ID:** App Functionality.
- **Diagnostics → Crash Data:** App Functionality.

Age rating: answer **None** to everything, which gives 4+.
Export compliance: already answered in the app config (no non-exempt encryption).
