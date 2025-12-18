# Plan: Enhance PlantDetails Screen with Tests, Editing, Extended Data, and Care Features
## Objective
Implement comprehensive testing and significant feature enhancements to `PlantDetails` screen (`src/screens/PlantSearch/PlantDetails/index.tsx`). Use the existing `CustomizationModal` pattern (which wraps `PlantForm`) for editing user plant data. Extend `IUserPlant` to support care history tracking. Display all available `IPlant` fields currently hidden from the details view.

## Steps

### 1. Create test suite
Create comprehensive test file for `PlantDetails/index.tsx` covering:
- Redux plant retrieval by ID from route params
- Loading states while fetching merged plant data
- Navigation params validation
- Merged plant data display (custom_name, scientific_name, description, etc.)
- Missing plant error state (when plantId not found in Redux)
- Image fallback rendering (shows leaf icon when no image available)

### 2. Add edit button and integrate CustomizationModal
Add editing capability to allow users to modify their plant data:
- Add floating edit button or header action button
- Import and integrate existing `CustomizationModal` component
- Pass `displayUserPlantData={true}` and `isAddingNewPlant={false}` props
- Handle save callback to update Redux store via `updatePlant` action
- Persist changes to Firebase using existing helper functions
- Allow editing of user-specific fields:
  - `custom_name`
  - `custom_notes`
  - `houseLocation`
  - `custom_watering_schedule`
  - `date_added`

### 3. Extend displayed IPlant fields
Show currently hidden plant data fields, organized in themed sections:

**Additional fields to display:**
- `common_names` (array - show as comma-separated list)
- `fertilizer_needs`
- `temperature_minimum` / `temperature_maximum` (show as range)
- `humidity_requirements`
- `growth_rate`
- `pruning_needs`
- `pest_susceptibility` (array - show as list)
- `toxicity` (important for safety)
- `growing_season`
- `mature_size`

**Organization suggestions:**
- Care Requirements section (watering, sunlight, fertilizer, humidity)
- Growth Information section (growth_rate, mature_size, growing_season, pruning)
- Safety & Considerations section (toxicity, pest_susceptibility)
- Temperature section (min/max tolerances)

### 4. Extend IUserPlant interface with care tracking
Add care history tracking to the data model:

**Update `IUserPlant` interface in `constants/IPlant.ts`:**
```typescript
watering_history?: Date[];
fertilizing_history?: Date[];
```

**Update Redux slice:**
- Modify `updatePlant` action in `userPlantsSlice.ts` to handle new fields
- Ensure proper serialization/deserialization of Date arrays

**Create Firebase helper functions:**
- `logWateringEvent(userId: string, plantId: string, date: Date): Promise<void>`
- `logFertilizingEvent(userId: string, plantId: string, date: Date): Promise<void>`
- Functions should update both the last_watered_date field and append to history arrays


## Further Considerations

### 1. Apply CustomizationModal to SearchResult component?
Currently `SearchResult` only displays plant name as a button. Consider:
- Add modal on press to preview plant details before adding
- Allow users to customize plant data immediately in search context
- Could improve UX by reducing navigation steps
- **Decision needed:** Is preview + quick-add valuable, or does it complicate search flow?

### 2. Care history display format
Multiple options for displaying care history:
- **Simple list:** Vertical list of dates with icons (simplest, implement first)
- **Timeline view:** Visual timeline showing care events chronologically

## Implementation Order

1. **Tests first** - Establish baseline coverage for current functionality
2. **Edit modal integration** - Adds immediate user value, uses existing components
3. **Extended field display** - Quick win, no data model changes needed

## Success Criteria

- PlantDetails test coverage ≥80%
- Users can edit all user-specific plant fields via modal
- All relevant IPlant fields displayed in organized sections
- Care history persists to Firebase and displays in UI
- Delete plant functionality works with confirmation
- No regressions in existing functionality
