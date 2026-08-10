# Step 3: Render WateringSplash Component

## Goal
Add the WateringSplash component to the component tree in PlantDetails screen.

## File to Modify
`src/screens/PlantSearch/PlantDetails/index.tsx`

## Changes

### Location
Add the WateringSplash component at the end of the return statement, after the closing ScrollView tag (around line 165-170).

### Code to Add
```tsx
return (
  <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* ... existing content ... */}
    </ScrollView>

    {/* Add this WateringSplash component */}
    <WateringSplash
      visible={showWateringSplash}
      onComplete={() => setShowWateringSplash(false)}
    />
  </View>
);
```

### Important Notes
- The WateringSplash must be rendered OUTSIDE the ScrollView
- It needs to be a sibling of ScrollView, not a child
- The parent View should have `flex: 1` (already present in styles)
- The splash has `position: absolute` so it overlays everything

### Complete Return Structure
```tsx
return (
  <View style={styles.container}>
    {!plant ? (
      <LoadingOverlay message="Loading plant details..." />
    ) : (
      <>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Plant image */}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{plant.description}</Text>
          </View>

          {/* Watering Prediction */}
          <WateringPrediction plant={plant} onWater={handleLogWatering} />

          {/* Other sections... */}
        </ScrollView>

        <WateringSplash
          visible={showWateringSplash}
          onComplete={() => setShowWateringSplash(false)}
        />
      </>
    )}
  </View>
);
```

## Next Step
Proceed to Step 4 for optional styling refinements.
