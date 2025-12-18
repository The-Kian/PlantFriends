# Plant Date Handling Refactor

## Summary
Refactored plant date handling to use **epoch milliseconds (number)** throughout the app. Simple and consistent: numbers go in, numbers come out.

## What Changed

### Type System
- **IUserPlant interface** ([src/constants/IPlant.ts](src/constants/IPlant.ts)):
  - `date_added?: Date` → `date_added?: number`
  - `last_watered_date?: Date | null` → `last_watered_date?: number | null`
  - `next_watering_date?: Date | null` → `next_watering_date?: number | null`

### Core Logic
- **Watering calculations** ([src/helpers/plants/wateringCalculations.ts](src/helpers/plants/wateringCalculations.ts)):
  - `calculateNextWateringDate(lastWateredMs: number, frequencyDays: number): number`
  - `getDaysUntilWatering(nextWateringDateMs: number): number`
  - All functions work with epoch milliseconds

### Components & UI
- **WateringPrediction** ([src/components/plant/WateringPrediction.tsx](src/components/plant/WateringPrediction.tsx)):
  - Accepts `lastWatered: number | null`
  - Uses `Date.now()` and epoch millisecond calculations

- **PlantDetailsScreen** ([src/screens/PlantSearch/PlantDetails/index.tsx](src/screens/PlantSearch/PlantDetails/index.tsx)):
  - `handleLogWatering` stores epoch milliseconds directly

- **UserDataSection** ([src/components/plant/customization/PlantForm/UserDataSection.tsx](src/components/plant/customization/PlantForm/UserDataSection.tsx)):
  - Converts Date picker values to epoch milliseconds: `date.getTime()`
  - Converts epoch milliseconds back to Date for display: `new Date(epochMs)`

### Data Layer
- **fetchUserPlants** ([src/helpers/plants/fetchUserPlants.ts](src/helpers/plants/fetchUserPlants.ts)):
  - Returns data as-is from Firestore (numbers stored as numbers)

- **saveUserPlantToFirebase** ([src/helpers/firebase/saveToFirebase/saveUserPlantToFirebase.ts](src/helpers/firebase/saveToFirebase/saveUserPlantToFirebase.ts)):
  - Saves data as-is to Firestore (numbers stored as numbers)

- **seedFakePlants** ([src/dev/seedFakePlants.ts](src/dev/seedFakePlants.ts)):
  - Uses `.getTime()` to store epoch milliseconds

### Tests
- **Test suites**:
  - [wateringCalculations.test.ts](src/helpers/plants/wateringCalculations.test.ts) - 15 tests
  - [UserDataSection.test.tsx](src/components/plant/customization/PlantForm/UserDataSection.test.tsx) - expects epoch milliseconds

## Benefits

### ✅ Simple
- **No conversion logic needed** - numbers in, numbers out
- Firestore stores numbers as numbers, returns numbers as numbers
- One type everywhere: `number`

### ✅ Redux Safe
- No Date objects in state = no serialization warnings
- Numbers are JSON-serializable primitives

### ✅ Type Safe
- TypeScript catches Date/number mismatches
- No ambiguity about representation

### ✅ Performance
- Lightweight primitives
- No Date object creation overhead
- Simple arithmetic: `(Date.now() - lastWatered) / (1000 * 60 * 60 * 24)`

## Usage Patterns

### Store dates (write)
```typescript
// Use Date.now() or date.getTime()
const plant = {
  last_watered_date: Date.now(),
  date_added: new Date('2025-12-18').getTime()
};
```

### Display dates (read)
```typescript
// Convert to Date for formatting
const formatted = new Date(plant.last_watered_date).toLocaleDateString();
```

### Date calculations
```typescript
// Work directly with epoch milliseconds
const daysSince = (Date.now() - plant.last_watered_date) / (1000 * 60 * 60 * 24);
```

### Date pickers
```typescript
// Input: convert Date to number
onDateChange={(date) => updatePlant({ date_added: date.getTime() })}

// Display: convert number to Date  
<DatePicker date={plant.date_added ? new Date(plant.date_added) : new Date()} />
```

## Testing Results
- ✅ TypeScript: No errors
- ✅ Watering calculations: 15/15 passing
- ✅ User plant tests: 6/6 passing

## Migration from Old Data

If Firestore contains old Date objects or Timestamp objects, they need migration. Options:

1. **Client-side**: Check type on read and convert once:
   ```typescript
   const normalized = typeof plant.last_watered_date === 'number' 
     ? plant.last_watered_date 
     : new Date(plant.last_watered_date).getTime();
   ```

2. **Server script**: One-time migration script to convert all documents
