# Step 2: Add Splash State Management

## Goal
Update the PlantDetails screen to show the splash instead of Alert dialog.

## File to Modify
`src/screens/PlantSearch/PlantDetails/index.tsx`

## Changes

### 1. Add Import
At the top of the file (around line 3-10), add:
```tsx
import { WateringSplash } from '../../../components/watering/WateringSplash';
```

### 2. Add State
Inside the PlantDetailsScreen component (around line 48-50), add:
```tsx
const [showWateringSplash, setShowWateringSplash] = useState(false);
```

### 3. Update handleLogWatering Function
Replace the Alert.alert calls in the handleLogWatering function (lines 58-89):

**Before:**
```tsx
Alert.alert('Success', 'Watering logged successfully!');
```

**After:**
```tsx
setShowWateringSplash(true);
```

Also replace error Alert:
**Before:**
```tsx
Alert.alert('Error', 'Failed to log watering');
```

**After:**
```tsx
Alert.alert('Error', 'Failed to log watering'); // Keep Alert for errors
```

### 4. Complete Modified Function
The updated handleLogWatering should look like:
```tsx
const handleLogWatering = async () => {
  if (!user?.uid) {
    Alert.alert('Error', 'You must be logged in to log watering');
    return;
  }

  if (!plant) {
    Alert.alert('Error', 'Plant not found');
    return;
  }

  try {
    const now = new Date();
    const wateringFrequencyDays =
      plant.customWateringSchedule?.frequencyDays || plant.wateringFrequencyDays;

    const nextWateringDate = calculateNextWateringDate(
      now,
      wateringFrequencyDays
    );

    const updatedPlant: UserPlant = {
      ...plant,
      lastWateredDate: now.toISOString(),
      nextWateringDate: nextWateringDate.toISOString(),
    };

    await saveUserPlantToFirebase(user.uid, updatedPlant);
    dispatch(updatePlant(updatedPlant));

    // Show splash instead of Alert
    setShowWateringSplash(true);
  } catch (error) {
    console.error('Error logging watering:', error);
    Alert.alert('Error', 'Failed to log watering');
  }
};
```

## Next Step
Proceed to Step 3 to render the splash component.
