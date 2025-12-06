# PlantFriends Technical Debt & Modernization Plan

**Last Updated:** December 6, 2025
**Priority Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low

---

## 🔴 CRITICAL - Address Before Adding Features

### 1. **Duplicate File Structure (Severe Architecture Issue)**

**Location:** `src/helpers/` directory has multiple duplicate files
**Issue:** 
- Two versions of `fetchFirebasePlants.ts` (root and `firebase/` subdirectory)
- Two versions of `getUserPlantData.ts`
- Two versions of `savePlantToFirebase.ts`
- Two versions of `removeUserPlantFromFirebase.ts`
- Hook duplicates in `src/hooks/plants/` and `src/hooks/user/`

**Impact:** Confusion about which file is canonical, potential bugs from using wrong version
**Fix:**
```
1. Audit all imports to determine which version is actually used
2. Delete unused duplicates
3. Consolidate to firebase/ subdirectories for consistency
4. Update all import paths
5. Run tests to ensure nothing breaks
```

**Files to consolidate:**
```
DELETE: src/helpers/fetchFirebasePlants.ts (old API)
KEEP: src/helpers/firebase/fetchFirebasePlants.ts (new API)

DELETE: src/helpers/getUserPlantData.ts (re-export)
KEEP: src/helpers/firebase/getUserPlantData.ts

DELETE: src/helpers/savePlantToFirebase.ts (re-export)
KEEP: src/helpers/firebase/savePlantToFirebase.ts

DELETE: src/helpers/saveToFirebase/saveUserPlantToFirebase.ts (wrong location)
KEEP: src/helpers/firebase/saveToFirebase/saveUserPlantToFirebase.ts

DELETE: src/hooks/user/* (all re-exports)
KEEP: src/hooks/plants/*
```

### 2. **Console.log/error Usage Throughout Codebase**

**Location:** 30+ files across the codebase
**Issue:** Production code uses console.log/error for error handling
**Impact:** 
- No proper error tracking
- Poor production debugging
- Silent failures users can't report
- Performance impact

**Fix:**
```typescript
// Install error tracking
yarn add react-native-error-boundary
yarn add @sentry/react-native  // or similar

// Create error logging service
// src/services/errorLogger.ts
export const logError = (error: Error, context?: object) => {
  if (__DEV__) {
    console.error(error, context);
  } else {
    // Send to Sentry/Crashlytics
  }
};

// Replace all console.error with logError
```

**Priority Files:**
- `src/context/auth/AuthProvider.tsx` - Critical auth errors
- `src/hooks/plants/usePlantManagement.ts` - User data loss risk
- All Firebase helper functions

### 3. **Missing Error Boundaries**

**Location:** No error boundaries in app
**Issue:** Single component error crashes entire app
**Impact:** Poor user experience, no error recovery
**Fix:**
```tsx
// src/components/ui/ErrorBoundary.tsx
import { ErrorBoundary as RNErrorBoundary } from 'react-native-error-boundary';

// Wrap app sections in ErrorBoundary
<RNErrorBoundary>
  <YourComponent />
</RNErrorBoundary>
```

### 4. **Inconsistent Error Handling in Auth**

**Location:** `src/context/auth/AuthProvider.tsx`
**Issue:** 
- Login only handles `auth/user-not-found`, other errors logged to console
- Registration handles 2 errors, rest logged
- Using Alert.alert directly (not testable)

**Impact:** Poor UX, untestable code
**Fix:**
```typescript
// Create error message mapper
const getAuthErrorMessage = (code: string): string => {
  const errors: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check connection',
    // ... all error codes
  };
  return errors[code] || 'An unexpected error occurred';
};

// Create toast/snackbar system instead of Alert.alert
```

### 5. **No Environment Variable Validation**

**Location:** No `.env.example` file, no runtime validation
**Issue:** App will crash if env vars missing, no documentation
**Impact:** Poor DX, difficult onboarding
**Fix:**
```typescript
// Create .env.example
PERENUAL_API_KEY=your_key_here

// Create src/config/env.ts
import { PERENUAL_API_KEY } from '@env';

const validateEnv = () => {
  if (!PERENUAL_API_KEY) {
    throw new Error('PERENUAL_API_KEY is not set');
  }
};

validateEnv();

export const config = {
  perenualApiKey: PERENUAL_API_KEY,
};
```

### 6. **No API Client Abstraction**

**Location:** Direct fetch calls in `src/helpers/plants/plantAPI/fetchPlantAPI.ts`
**Issue:** No retry logic, timeout handling, or interceptors
**Impact:** Poor error handling, no request/response transformation
**Fix:**
```typescript
// Create src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    logError(error);
    return Promise.reject(error);
  }
);
```

---

## 🟡 HIGH PRIORITY - Modernization

### 7. **Use TypeScript `any` Throughout Code**

**Location:** 26+ instances across codebase
**Issue:** Type safety compromised
**Files:**
- `src/helpers/plants/plantAPI/mapOpenFarmPlantToIPlant.ts` - function parameter is `any`
- `src/hooks/plants/useMergedPlant.ts` - type assertions with `any`
- Multiple test files with `@typescript-eslint/no-explicit-any` disabled

**Fix:**
```typescript
// Define proper types for all external APIs
interface OpenFarmPlant {
  id: string;
  type: string;
  attributes: {
    name: string;
    images: Array<{ image_url: string }>;
    // ... complete type definition
  };
}

export const mapOpenFarmPlantToIPlant = (plant: OpenFarmPlant): IPlant => {
  // Now type-safe
};
```

### 8. **React.FC Usage (Deprecated Pattern)**

**Location:** `src/components/plant/plantCard.tsx`
**Issue:** React.FC is discouraged by React team, has issues with children prop
**Fix:**
```typescript
// OLD
const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress, onDelete }) => {

// NEW
const PlantCard = ({ plant, onPress, onDelete }: PlantCardProps) => {
```

### 9. **Inconsistent Export Patterns**

**Issue:** Mix of `export default` and named exports
**Impact:** Inconsistent import styles, harder refactoring
**Fix:**
```typescript
// Choose ONE pattern:

// OPTION 1: Named exports (recommended)
export const PlantCard = () => { /* ... */ };
export const usePlantManagement = () => { /* ... */ };

// OPTION 2: Default exports
// Keep only for pages/screens
export default function MyPlantsScreen() { /* ... */ }
```

### 10. **Missing Prettier Configuration**

**Issue:** No `.prettierrc` file, inconsistent formatting
**Impact:** Code style inconsistencies, merge conflicts
**Fix:**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 11. **Outdated React Native Navigation Pattern**

**Location:** `src/components/navigation/RootLayout.tsx`
**Issue:** Using manual auth stack switching instead of expo-router
**Impact:** More boilerplate, less type-safe navigation
**Recommendation:** Consider migrating to `expo-router` (file-based routing)

### 12. **No Centralized Theme Management**

**Location:** Scattered theme files in `src/theme/`, inline styles
**Issue:** 
- `StyleSheet.create` used inline in components
- Some components use theme, others use hardcoded colors
- No consistent spacing/typography system

**Fix:**
```typescript
// Consolidate all theme in one place
// Create styled-components or use NativeWind/Tailwind
import { createStyleSheet } from 'react-native-unistyles';

const stylesheet = createStyleSheet(theme => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
  }
}));
```

### 13. **Unused/Dead Code**

**Locations:**
- `src/common/defaultStyles.ts` - unused hook
- `src/common/styles.ts` - never imported
- `src/hooks/user/` - all re-exports, should be deleted
- Commented code in `fetchPlantAPI.ts`

**Fix:** Run dead code elimination
```bash
npx ts-prune | grep -v test  # Find unused exports
```

---

## 🟢 MEDIUM PRIORITY - Code Quality

### 14. **Missing Loading & Empty States**

**Location:** Most screens
**Issue:** No loading indicators, no empty state UI
**Fix:**
```tsx
// Add to all data-fetching screens
{loading && <LoadingSpinner />}
{!loading && data.length === 0 && <EmptyState />}
{!loading && data.length > 0 && <DataList />}
```

### 15. **No Pagination/Infinite Scroll**

**Location:** Plant lists
**Issue:** Could load hundreds of plants at once
**Fix:** Implement FlatList with `onEndReached`

### 16. **Fire-and-Forget Pattern in Delete**

**Location:** `src/hooks/plants/usePlantManagement.ts:79`
**Issue:** Uses `.then()` instead of await, no proper error handling
**Code:**
```typescript
persistDeletePlant(plant.id).then((removed) => {
  if (!removed) {
    console.error("Failed to remove plant from firebase");
  }
});
```
**Fix:**
```typescript
try {
  const removed = await persistDeletePlant(plant.id);
  if (!removed) {
    showErrorToast('Failed to delete plant from server');
    // Optionally revert optimistic update
    dispatch(addPlant(plant));
  }
} catch (error) {
  logError(error);
  showErrorToast('Failed to delete plant');
  dispatch(addPlant(plant)); // Revert
}
```

### 17. **Generic Test Utils Not Used Consistently**

**Location:** `src/test-utils/`
**Issue:** Good test utilities exist but not used everywhere
**Fix:** Update test documentation, ensure all tests use helpers

### 18. **No Accessibility (a11y) Labels**

**Location:** All interactive components
**Issue:** No `accessibilityLabel` or `accessibilityHint`
**Impact:** App unusable for screen reader users
**Fix:**
```tsx
<TouchableOpacity
  accessibilityLabel="Delete plant"
  accessibilityRole="button"
  accessibilityHint="Removes this plant from your collection"
>
```

### 19. **Redux Store Setup Issue**

**Location:** `App.tsx` and `src/store/store.ts`
**Issue:** `setupStore()` called on every render (creates new store each time)
**Fix:**
```typescript
// App.tsx
const store = setupStore(); // Outside component

export default function App() {
  return (
    <Provider store={store}>
```

### 20. **No Image Optimization**

**Location:** All image loads
**Issue:** No placeholder, no caching strategy, no error handling
**Fix:** Use `expo-image` instead of `Image`
```typescript
import { Image } from 'expo-image';

<Image
  source={imageUri}
  placeholder={require('./placeholder.png')}
  contentFit="cover"
  transition={200}
/>
```

---

## 🔵 LOW PRIORITY - Nice to Have

### 21. **README is Generic Template**

**Issue:** Still has default Expo instructions
**Fix:** Write proper project README with:
- Project description
- Architecture overview  
- Setup instructions (.env, Firebase)
- Development workflow
- Testing instructions
- Deployment process

### 22. **No Pre-commit Hooks**

**Fix:**
```bash
yarn add -D husky lint-staged
npx husky install

# .husky/pre-commit
npx lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 23. **No CI/CD Pipeline**

**Recommendation:** Set up GitHub Actions for:
- Linting
- Type checking
- Tests
- Build validation
- EAS builds

### 24. **Commented Out Code**

**Locations:**
- `src/helpers/plants/plantAPI/fetchPlantAPI.ts` - Old OpenFarm implementation
- `src/store/store.ts` - Redux dev tools commented out

**Fix:** Remove or properly feature-flag

### 25. **No Analytics/Monitoring**

**Recommendation:** Add:
- Analytics (Amplitude, Mixpanel)
- Performance monitoring (Sentry Performance)
- Crash reporting (Firebase Crashlytics)

### 26. **No Internationalization (i18n)**

**Issue:** All strings hardcoded in English
**Fix:** Add `react-i18next` if planning international release

---

## 📋 ACTION PLAN - Complete Before Adding Features

### Phase 1: Critical Cleanup (1-2 days)
1. ✅ Document all tech debt (this file)
2. ⬜ Resolve duplicate file structure
3. ⬜ Create proper error logging service
4. ⬜ Add error boundaries
5. ⬜ Create `.env.example` and validation
6. ⬜ Fix Redux store setup in App.tsx

### Phase 2: Type Safety (1 day)
1. ⬜ Remove all `any` types
2. ⬜ Define proper API response types
3. ⬜ Remove `React.FC` usage
4. ⬜ Enable strict TypeScript flags

### Phase 3: Error Handling (1 day)
1. ⬜ Refactor auth error handling
2. ⬜ Replace all console.error with proper logging
3. ⬜ Add try-catch to all async functions
4. ⬜ Implement toast/snackbar system

### Phase 4: Code Quality (1-2 days)
1. ⬜ Add Prettier, format all files
2. ⬜ Remove dead code
3. ⬜ Standardize export patterns
4. ⬜ Add pre-commit hooks
5. ⬜ Update README

### Phase 5: Polish (ongoing)
1. ⬜ Add loading states
2. ⬜ Add empty states
3. ⬜ Implement proper image handling
4. ⬜ Add accessibility labels
5. ⬜ Add tests for uncovered code

---

## 🎯 Success Metrics

After completing tech debt:
- ✅ Zero `any` types in src/
- ✅ Zero console.log/error in production
- ✅ All async functions have error handling
- ✅ Test coverage > 80%
- ✅ No ESLint errors
- ✅ All files formatted with Prettier
- ✅ README complete
- ✅ .env.example present