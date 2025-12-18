# Future-Themed Watering Demo Plan

## Demo Story ("Future You" Hackday)
- Premise: future you never forgets a watering; app predicts next watering, nudges with urgency color, and lets you log with one tap.
- Flow: open plant → see predictive card → adjust schedule → log watering → see updated next date and celebratory micro-animation.

## Visual Direction
- Palette: deep space background, cyan/teal primaries, magenta accent, soft amber for warnings. Use gradients (e.g., `linear-gradient(135deg, #0b1224, #0f1b37, #132a4f)`).
- Typography: swap headers to a futuristic sans (e.g., "Space Grotesk" or "Sora") via Expo Google Fonts; keep body in existing sans for readability.
- Surfaces: glassmorphism cards (translucent panels with blur), thin divider strokes, glowing focus rings for buttons.
- Icons: outline neon style for water droplets, checkmarks, schedule.

## Components to Polish
- Watering card: `src/components/plant/WateringPrediction.tsx`
  - Add gradient card background, subtle border, and glow when status is urgent.
  - Show a concise status chip ("On track", "Due soon", "Overdue") with icon.
  - Progress ring or bar indicating days until next watering; animate fill.
  - Add "Log watering" primary button + "Snooze 1 day" secondary pill.
- Plant details: `src/screens/PlantDetails/PlantDetails.tsx`
  - Surface both base schedule and custom schedule with a compact picker (segmented buttons: 3d/5d/7d/custom).
  - Inline edit for custom frequency with number stepper; confirm via CTA row.
  - Add "Timeline" row showing last 3 logs (mocked data acceptable for demo).
- Form picker: `src/components/plant/WateringSchedulePicker.tsx` (if present) / schedule control
  - Ensure buttons use new theme tokens and accessibility labels.

## Theming & Tokens
- Extend `src/theme/Colors.ts` with `spaceBg`, `neonCyan`, `neonMagenta`, `amberWarn`, `glassSurface`, `borderGlow`.
- Extend `src/theme/Fonts.ts` to include the new headline font weights; update `src/theme/index.ts` exports.
- Add spacing/touch target constants for pill buttons and cards.

## Interaction & Motion
- Micro animation on status change (fade/scale the status chip, ease-in-out 150–200ms).
- Button press feedback: ripple/opacity plus slight scale.
- Progress ring: animate to new value on prop change.
- Card entrance: staggered slide/fade when screen loads.

## Data & States to Showcase
- Seeds: ensure `src/dev/seedFakePlants.ts` has at least 3 plants—On-track (next in 3d), Due soon (next in 1d), Overdue (next in -1d).
- Edge cases: last-watered today (show celebratory state), snoozed by 1 day (reflects in next date).
- For demo, allow a "Simulate travel mode" toggle that halves watering frequency (optional mock state only).

## Error/Loading Polish (quick wins)
- Add loading shimmer to the card while fetching plant data.
- Add inline error banner if watering update fails (non-blocking retry button).

## CTA Layout
- Primary: "Log watering" (fills cyan → checkmark state after tap).
- Secondary: "Snooze 1 day" pill; disable if already overdue by >3 days (or keep enabled but warn).
- Tertiary: "Adjust schedule" link button to open picker/stepper.

## Demo Script (5–7 minutes)
1. Open a plant with on-track status; point out predictive card and theme.
2. Tap "Snooze 1 day" → show progress updates + next date moves.
3. Tap "Log watering" → show success state and updated timeline.
4. Switch to overdue plant; note urgent glow and amber warning chip.
5. Edit schedule via segmented picker; show immediate UI change.
6. Toggle light/dark if available; highlight glass surfaces holding up.
7. Close with readiness: tests, typed Redux, predictable helpers.

## Step-by-Step Build Guide (do in order)
1) Theme tokens
- Add colors/fonts/spacing to theme files; wire to button/card components so they render with the new palette.
- Quick checks: `yarn lint Colors.ts Fonts.ts` (optional), run app to ensure no import errors.

2) WateringPrediction polish
- Restyle the card (gradient, chip, progress ring/bar, CTA row, animations).
- Add snooze + log buttons; connect to existing handlers or mock state if the data flow is not ready.
- Quick check: `yarn test src/components/plant/WateringPrediction.test.tsx`.

3) PlantDetails schedule controls
- Add segmented schedule picker and custom stepper; show base/custom schedule values.
- Add a small timeline of last three logs (can be mocked for demo).
- Quick check: `yarn test src/screens/PlantDetails/PlantDetails.test.tsx` (create/extend if absent).

4) Data seeding for demo
- Update `src/dev/seedFakePlants.ts` with three plants: on-track (next 3d), due soon (1d), overdue (-1d).
- Keep timestamps deterministic (ms epoch) per `docs/PLANT_DATE_REFACTOR.md` guidance.

5) Loading + error states
- Add shimmer while watering data loads; add inline error banner with retry for failed updates.
- Quick check: run the screen and toggle network/offline in Expo dev menu to see the banner.

6) Tests and accessibility
- Add/adjust tests for new card states and CTA interactions; ensure buttons/chips have accessibility labels.
- Quick checks: `yarn test WateringPrediction.test.tsx PlantDetails.test.tsx`, `yarn lint`.

7) Demo prep
- Run `yarn start` then `yarn android`/`yarn ios`; preload the three seeded plants.
- Rehearse the Demo Script above; note timestamps so progress ring matches the story.

## Build Tasks Checklist
- [ ] Update theme tokens (Colors, Fonts, spacing) and wire to buttons/cards.
- [ ] Style WateringPrediction card (gradient, chip, progress ring, CTA row, animation).
- [ ] Add Snooze + Log actions; hook to existing handlers or mock state for demo.
- [ ] Enhance schedule picker/stepper UI in PlantDetails.
- [ ] Seed demo data covering on-track/due/overdue; ensure deterministic timestamps.
- [ ] Add light error/loading handling for the card.
- [ ] Add/adjust tests for card states and snooze/log interactions.

## Nice-to-Haves (time permitting)
- Confetti or pulse on successful log.
- Haptic feedback on CTA presses (platform-gated).
- Accessibility labels for all buttons and chips.
- Simple analytics logging (console stub) for demo narrative ("future insights").
