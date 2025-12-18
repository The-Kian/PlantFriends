# Plan: Next Watering Prediction Feature

Add a "future-focused" next watering prediction system that calculates and displays when each plant needs watering, with visual indicators for urgency. This directly supports the hackday theme by predicting future care needs.

## Overview

The feature leverages existing data fields (`last_watered_date`, `next_watering_date`, `custom_watering_schedule`, `watering_frequency`) that are currently unused. No database schema changes required.

## Steps

### 1. Create watering calculation helpers

**File:** `src/helpers/plants/wateringCalculations.ts` (NEW)

**Functions to implement:**
- `calculateNextWateringDate(lastWatered: Date, frequencyDays: number): Date`
  - Add frequency days to last watered date
  - Return calculated next watering date

- `getDaysUntilWatering(nextWateringDate: Date): number`
  - Calculate difference between next watering date and today
  - Return positive number (days remaining) or negative (days overdue)

- `getWateringStatus(daysUntil: number): { message: string, urgency: 'overdue' | 'urgent' | 'soon' | 'ok' }`
  - Return appropriate message based on days until watering
  - Classify urgency level for color coding
  - Examples:
    - daysUntil < 0: "Overdue by X days" (overdue)
    - daysUntil === 0: "Water today!" (urgent)
    - daysUntil === 1: "Water tomorrow" (urgent)
    - daysUntil <= 3: "Water in X days" (soon)
    - daysUntil > 3: "Next watering in X days" (ok)

- `getWateringFrequencyInDays(customSchedule?: string, baseFrequency?: number): number`
  - Map custom schedule strings to day values
  - Mapping:
   ```
   "Daily" -> 1
   "Every 3 days" -> 3
   "Weekly" -> 7
   "Bi-weekly" -> 14
   "Monthly" -> 30
   "As needed (check soil)" -> null (can't calculate)
   ```
  - Priority: custom_watering_schedule > watering_frequency > default 7

**Tests:** Create `wateringCalculations.test.ts` with comprehensive test coverage

### 2. Add WateringPrediction UI component

**File:** `src/components/plant/WateringPrediction.tsx` (NEW)

**Props interface:**
```typescript
interface WateringPredictionProps {
  lastWatered: Date | null;
  wateringFrequency: number;
  customSchedule?: string;
  onLogWatering: () => void;
}
```

**Display elements:**
- Last watered date (formatted, e.g., "Last watered: Dec 15, 2025")
- Next watering date and countdown
- Color-coded status message using urgency level
- Simple progress bar (View-based, no external library)
  - Show time elapsed since last watering vs. total frequency
  - Full bar = time to water
- "Log Watering" button (prominent when urgent/overdue)

**Styling:**
- Use themed colors based on urgency
- Responsive layout
- Icon support (water drop icon from Ionicons)

**Edge cases:**
- No last_watered_date: Show "Not watered yet" + "Log First Watering" button
- Can't calculate frequency: Show only last watered date, no prediction
- No data at all: Don't render component

**Tests:** Create `WateringPrediction.test.tsx` with component rendering tests

### 3. Enhance PlantDetails screen

**File:** `src/screens/PlantSearch/PlantDetails/index.tsx` (MODIFY)

**Changes:**
- Import `WateringPrediction` component
- Import watering calculation helpers
- Add "Log Watering" handler:
  ```typescript
  const handleLogWatering = async () => {
    const now = new Date();
    const frequency = getWateringFrequencyInDays(
      userPlant.custom_watering_schedule,
      mergedPlant?.watering_frequency
    );
    const nextDate = calculateNextWateringDate(now, frequency);
    
    const updatedPlant = {
      ...userPlant,
      last_watered_date: now,
      next_watering_date: nextDate,
    };
    
    dispatch(updatePlant(updatedPlant));
    // TODO: Persist to Firebase via existing helper
  };
  ```

- Add `WateringPrediction` component after "Watering Frequency" section:
  ```tsx
  {mergedPlant?.watering_frequency && (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Watering Frequency</ThemedText>
      <ThemedText>Every {mergedPlant.watering_frequency} days</ThemedText>
    </ThemedView>
  )}
  
  {/* NEW: Watering Prediction Section */}
  <WateringPrediction
    lastWatered={userPlant.last_watered_date}
    wateringFrequency={mergedPlant?.watering_frequency}
    customSchedule={userPlant.custom_watering_schedule}
    onLogWatering={handleLogWatering}
  />
  ```

**Additional considerations:**
- Show success feedback after logging watering (toast/alert)
- Handle errors if Firebase update fails
- Ensure Redux state updates immediately for responsive UI

### 4. Add urgency colors to theme (optional)

**File:** `src/theme/Colors.ts` (MODIFY)

**Add to color palette:**
```typescript
warning: '#FFA500',  // Orange for "soon" status
urgent: '#FF0000',   // Red (or use existing redButton)
success: '#00A86B',  // Green (or use existing greenButton)
```

**Existing colors to use:**
- `error: '#FF5252'` 
 overdue status
- `greenButton: '#00A86B'` 
 ok/healthy status
- `redButton: '#FF0000'` 
 urgent status

**Alternative:** If prefer not to modify theme, use inline color values in component with theme.colors fallbacks

### 5. Add watering badge to PlantCard (optional stretch goal)

**File:** `src/components/plant/plantCard.tsx` (MODIFY)

**Changes:**
- Import watering calculation helpers
- Calculate watering status for the plant
- Add small badge/indicator when urgent or overdue
- Position badge in top-right corner of card or next to plant name

**Badge display:**
- Show only if daysUntil <= 1 (urgent) or < 0 (overdue)
- Color-coded (red for overdue, orange/yellow for urgent)
- Text: "Water!" or "Overdue"
- Keep it small and unobtrusive

**Benefit:** Users can see which plants need watering from list view without opening details

## Implementation Order

1. **Helpers first** - Foundation for all calculations
2. **WateringPrediction component** - Reusable UI element
3. **PlantDetails integration** - Core feature implementation
4. **Theme colors** - Polish and visual consistency
5. **PlantCard badge** - Nice-to-have enhancement (time permitting)

## Data Flow

```
User opens PlantDetails
  

Read last_watered_date from Redux (userPlant)
  

Get watering_frequency from merged plant data
  

Calculate next_watering_date (if not already stored)
  

Calculate daysUntil from next_watering_date
  

Determine urgency level
  

Display prediction with color coding

User clicks "Log Watering"
  

Update last_watered_date = now
  

Calculate and update next_watering_date
  

Dispatch updatePlant(updatedPlant)
  

Persist to Firebase
  

UI updates with new prediction
```

## Testing Strategy

### Unit Tests
- `wateringCalculations.test.ts` - Test all calculation functions
- Test edge cases (null dates, invalid frequencies, past dates)
- Test date math accuracy

### Component Tests
- `WateringPrediction.test.tsx` - Render tests for all urgency states
- Test button interaction
- Test with missing data

### Integration Tests (optional)
- Test PlantDetails screen with watering prediction
- Test Redux update flow
- Test Firebase persistence

## Edge Cases to Handle

1. **No last_watered_date:** Show "Not watered yet" state
2. **Invalid frequency:** Fallback to 7 days or hide prediction
3. **Future last_watered_date:** Treat as today (data integrity issue)
4. **Very old last_watered_date:** Handle large negative numbers gracefully
5. **Null/undefined checks:** Defensive programming throughout
6. **Date serialization:** Firebase stores dates as timestamps, ensure proper conversion
7. **Timezone handling:** Use user's local timezone for all date displays

## Future Enhancements (Out of Scope)

- Push notifications for watering reminders
- Watering history tracking (log multiple events)
- Adjust frequency based on season/weather
- Machine learning to optimize watering schedule
- Calendar view showing all plants' watering schedule
- Widget showing plants that need watering today

## Success Criteria

- ✅ Calculation helpers implemented with >90% test coverage
- ✅ WateringPrediction component renders correctly in all states
- ✅ PlantDetails shows accurate next watering prediction
- ✅ "Log Watering" button updates dates and persists to Firebase
- ✅ Visual urgency indicators work (color coding)
- ✅ No crashes or errors with edge cases
- ✅ Feature is intuitive and adds value to user experience

## Hackday Theme Alignment: "Future"

This feature directly addresses the "future" theme by:
- **Predicting** when plants will need water in the future
- Helping users **plan ahead** for plant care
- Showing **proactive** care recommendations
- Preventing future problems (plant death from neglect)
- Using **forward-looking** data visualization (countdown, progress)

The predictive nature makes this a perfect fit for a "future-focused" hackday project!
