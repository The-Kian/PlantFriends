# Two-phone manual test script

Run this before each release, on two Android phones with the same build
(from **Build Android test app**, or the Play internal track). Phone A is the
household creator; phone B is the housemate. Tick each box; write failures
under "Failures" at the bottom with the date and build.

Setup: both phones signed in with different accounts, notifications allowed,
phone A has at least one plant, and neither is in the other's household yet.
Reminders are never sent 21:00 to 08:00 in the household's time zone, so run
the reminder parts in the day.

## 1. Join
- [ ] A: Profile → **Invite housemate** → share the code to B.
- [ ] B: Profile → **Join a household** → enter the code → the prompt names
      A's household → **Join**.
- [ ] B sees A's shared plants without signing out. B's own plants are there
      as personal plants.
- [ ] A wrong code and an expired code both say the same "invalid" message.

## 2. Shared watering
- [ ] Share a plant. B taps **Watered**: A gets "B watered …" and A's card
      shows "by B".
- [ ] A turns off **Housemate activity**; B waters; A gets nothing. Turn it on.

## 3. Due reminder and nudge
Set a plant's `next_watering_date` in the Firebase console to about 5 minutes
ahead (allow 20 for the scheduler).
- [ ] Personal plant: only its owner gets "Time to water …".
- [ ] Shared plant: both get "needs watering".
- [ ] Tapping the reminder opens that plant, app closed and app open.
- [ ] Watering from either phone clears the reminder from both trays.
- [ ] Leave one due and unwatered: one "still thirsty" about 24 hours later,
      then nothing.
- [ ] **Quiet hours:** a plant due at 22:00 reminds at about 08:00, not
      overnight.
- [ ] **Watering reminders** off on one phone: that phone gets none.
- [ ] Per-plant reminders off: nobody gets that plant's reminder.
- [ ] No reminder arrives twice on one phone.

## 4. Leave and remove (see also session 2 in the plan)
- [ ] B leaves: B is in a new empty household; A's plants stay; B is gone
      from the members list and from every carer list.
- [ ] A invites again, B rejoins.
- [ ] A removes B. B's app switches over by itself.
- [ ] On B (rejoined), there is no remove button beside A.
- [ ] A leaves with B in the household: B becomes the creator.
- [ ] Alone in a household there is no **Leave household** button.

## 5. Account deletion with a housemate remaining
- [ ] B deletes their account. A's plants all remain; plants only B cared
      for are now shared; B is not in A's members list.
- [ ] A signs in again and nothing is missing.

## 6. Offline
- [ ] Phone in airplane mode: tap **Watered**. The screen moves on within
      about 3 seconds and the plant shows as watered.
- [ ] Add a plant offline. The modal closes within about 3 seconds.
- [ ] Turn the connection back on. Both writes appear on the other phone.
- [ ] Search offline shows a message under the box, not an alert.
- [ ] Join offline says "You're offline".

## 7. Notification permission denied
- [ ] Deny notifications in the phone's settings. Profile shows the hint and
      **Open settings** opens the app's settings page.

## 8. Fresh install on an old account
- [ ] Uninstall, install the build, sign in with an account that has plants.
      Plants, household and members are all there; permission is asked after
      the first plant is added or watered, not on launch.

## 9. Screen reader and text size
- [ ] TalkBack on: plant cards read as one item (name, status, last watered)
      and the trash button reads "Delete <plant name>".
- [ ] Settings → Font size and Display size at the largest: Home, My Plants,
      Plant details and Profile don't cut off text or overlap buttons.

## Failures
