# Code Quality Issues That Make the Codebase Look Amateur

This document highlights specific patterns and practices in the codebase that need immediate attention to appear professional.

## 🚨 Most Obvious Amateur Indicators

### 1. Duplicate Files Everywhere
**What it looks like:**
```
src/helpers/fetchFirebasePlants.ts
src/helpers/firebase/fetchFirebasePlants.ts  ← Two versions!

src/helpers/getUserPlantData.ts
src/helpers/firebase/getUserPlantData.ts     ← Two versions!

src/hooks/plants/usePlantCustomizations.ts
src/hooks/user/usePlantCustomizations.ts     ← Just a re-export!
```

**Why it's amateur:** Shows poor planning and refactoring discipline. Professional codebases have one canonical location for each piece of functionality.

**How to fix:** Delete duplicates, consolidate to one location, update imports.

---

### 2. Console.log/error in Production Code
**What it looks like:**
```typescript
// Throughout the codebase:
console.error("Error fetching plants:", error);
console.log(`🚀 - KP -  ~ userPlantData:`, userPlantData);  // Emoji debugging!
console.warn("Failed to fetch");
```

**Why it's amateur:** Production apps use proper error tracking services, not console statements. The emoji debug log is especially unprofessional.

**How to fix:**
```typescript
// Create proper error service
import { logError } from '@/services/errorLogger';

logError(error, { context: 'fetchPlants', userId });
```

---

### 3. TypeScript `any` Everywhere
**What it looks like:**
```typescript
export const mapOpenFarmPlantToIPlant = (plant: any): IPlant => {
  // No type safety at all!
}

// In hooks
if ((userPlant as any).name || (userPlant as any).images) {
  // Type assertion abuse
}
```

**Why it's amateur:** TypeScript exists for type safety. Using `any` defeats the purpose and shows laziness.

**How to fix:**
```typescript
interface OpenFarmPlant {
  id: string;
  attributes: {
    name: string;
    images: Array<{ image_url: string }>;
  };
}

export const mapOpenFarmPlantToIPlant = (plant: OpenFarmPlant): IPlant => {
  // Now type-safe!
}
```

---

### 4. No Error Boundaries
**What it looks like:**
- App crashes completely if any component has an error
- No graceful error handling
- No error recovery

**Why it's amateur:** Professional apps never show users a white screen. They have fallback UI.

**How to fix:**
```tsx
// Wrap app sections
import { ErrorBoundary } from 'react-native-error-boundary';

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={logError}
>
  <YourApp />
</ErrorBoundary>
```

---

### 5. Inconsistent Code Style
**What it looks like:**
```typescript
// Some files use default export
export default PlantCard;

// Some use named exports
export const usePlantManagement = () => {};

// Some use React.FC
const PlantCard: React.FC<Props> = () => {};

// Some don't
const PlantCard = (props: Props) => {};

// Some use StyleSheet.create inline, some don't
// Some use theme, some hardcode colors
```

**Why it's amateur:** Looks like multiple junior developers worked without coordination.

**How to fix:** Establish and enforce consistent patterns. Add Prettier.

---

### 6. No Environment Variable Validation
**What it looks like:**
```typescript
// Just assumes env vars exist
const API_KEY = process.env.PERENUAL_API_KEY;
// App crashes at runtime if missing!
```

**Why it's amateur:** Professional apps validate configuration at startup.

**How to fix:**
```typescript
// src/config/env.ts
if (!process.env.PERENUAL_API_KEY) {
  throw new Error('PERENUAL_API_KEY must be set in .env file');
}

export const config = {
  perenualApiKey: process.env.PERENUAL_API_KEY,
};
```

---

### 7. Fire-and-Forget Error Handling
**What it looks like:**
```typescript
// In usePlantManagement.ts
persistDeletePlant(plant.id).then((removed) => {
  if (!removed) {
    console.error("Failed to remove plant from firebase");
    // But we already removed it from UI! User thinks it worked!
  }
});
```

**Why it's amateur:** Optimistic updates without proper rollback = data loss.

**How to fix:**
```typescript
try {
  const removed = await persistDeletePlant(plant.id);
  if (!removed) {
    dispatch(addPlant(plant)); // Rollback
    showErrorToast('Failed to delete');
  }
} catch (error) {
  dispatch(addPlant(plant)); // Rollback
  logError(error);
}
```

---

### 8. Commented-Out Code
**What it looks like:**
```typescript
// export const fetchOpenFarmPlants = async (searchQuery: string): Promise<IPlant[]> => {
//   try {
//     const response = await fetch(`https://openfarm.cc/api/v1/crops?query=${searchQuery}`);
//     // ... 20 lines of commented code
```

**Why it's amateur:** Use git history, not comments. This clutter looks unprofessional.

**How to fix:** Delete it. Git remembers.

---

### 9. Generic Expo Template README
**What it looks like:**
```markdown
# Welcome to your Expo app 👋
This is an [Expo](https://expo.dev) project created with...
```

**Why it's amateur:** Shows you never bothered to document your app.

**How to fix:** ✅ Already fixed in this review!

---

### 10. No Loading/Error States
**What it looks like:**
```tsx
// Screen just shows nothing while loading
// No spinner, no skeleton, no feedback
<FlatList data={plants} />
```

**Why it's amateur:** Professional apps always show loading indicators.

**How to fix:**
```tsx
{loading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{!loading && !error && plants.length === 0 && <EmptyState />}
{!loading && !error && plants.length > 0 && <PlantList />}
```

---

### 11. Redux Store Created on Every Render
**What it looks like:**
```tsx
// App.tsx
export default function App() {
  return (
    <Provider store={setupStore()}>  {/* New store every render! */}
```

**Why it's amateur:** Basic React mistake. Store should be singleton.

**How to fix:**
```tsx
const store = setupStore(); // Outside component

export default function App() {
  return <Provider store={store}>
```

---

### 12. Unused Files Left in Codebase
**What it looks like:**
```
src/common/defaultStyles.ts  ← Never imported
src/common/styles.ts         ← Never imported
src/hooks/user/*            ← All just re-exports
```

**Why it's amateur:** Shows poor code hygiene and cleanup discipline.

**How to fix:** Delete unused files. Use `ts-prune` to find them.

---

### 13. No Prettier Configuration
**What it looks like:**
- Inconsistent spacing
- Mixed quote styles
- Inconsistent trailing commas
- Different line lengths

**Why it's amateur:** Modern projects auto-format. Manual formatting is 2010.

**How to fix:**
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 80,
  "trailingComma": "es5"
}
```

---

### 14. Alert.alert for All User Feedback
**What it looks like:**
```typescript
Alert.alert("Error updating profile:", error.message);
Alert.alert("User not found");
Alert.alert("That email address is already in use!");
```

**Why it's amateur:** Native alerts are jarring and don't match app design.

**How to fix:** Use toast/snackbar library for non-critical messages.

---

### 15. No Accessibility Labels
**What it looks like:**
```tsx
<TouchableOpacity onPress={onDelete}>
  <Text>Delete</Text>
</TouchableOpacity>
// Screen readers can't understand this!
```

**Why it's amateur:** Shows lack of care for accessibility standards.

**How to fix:**
```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Delete plant"
  accessibilityHint="Removes this plant from your collection"
  onPress={onDelete}
>
```

---

## 🎯 Quick Wins to Look More Professional

### Do These First (< 1 hour total)

1. **Delete duplicate files** (15 min)
   - Remove all files in `src/hooks/user/`
   - Choose one version of each Firebase helper
   - Update imports

2. **Add .env.example** (5 min)
   - ✅ Already done!

3. **Fix Redux store** (5 min)
   - Move `setupStore()` outside component

4. **Delete commented code** (10 min)
   - Remove all commented-out code blocks

5. **Delete unused files** (10 min)
   - Remove `src/common/defaultStyles.ts`
   - Remove `src/common/styles.ts`

6. **Add Prettier** (10 min)
   ```bash
   yarn add -D prettier
   # Create .prettierrc
   # Run: yarn prettier --write "src/**/*.{ts,tsx}"
   ```

### After Quick Wins (1-2 days)

7. **Replace console.* with proper logging** (2-3 hours)
8. **Add error boundaries** (1 hour)
9. **Remove all `any` types** (2-3 hours)
10. **Add loading states** (1-2 hours)
11. **Fix error handling** (2-3 hours)

---

## 📊 Before/After Checklist

### Signs of Amateur Codebase ❌
- [ ] Duplicate files
- [ ] console.log debugging
- [ ] TypeScript `any` everywhere
- [ ] No error boundaries
- [ ] Commented-out code
- [ ] Template README
- [ ] No loading states
- [ ] Inconsistent code style
- [ ] Fire-and-forget errors
- [ ] No accessibility

### Signs of Professional Codebase ✅
- [ ] Single source of truth
- [ ] Proper error logging service
- [ ] Strict TypeScript
- [ ] Error boundaries with fallback UI
- [ ] Clean code (no comments)
- [ ] Comprehensive README
- [ ] Loading/error/empty states
- [ ] Consistent style (Prettier)
- [ ] Proper error handling
- [ ] Accessibility labels

---

## 💡 Remember

**"Code is read 10x more than it's written"**

Professional code isn't about being clever—it's about being:
- **Clear**: Easy to understand
- **Consistent**: Follows patterns
- **Complete**: Has error handling, loading states
- **Clean**: No clutter, no duplication
- **Considerate**: Documented, accessible

Make these changes and your codebase will look like a senior developer wrote it! 🚀
