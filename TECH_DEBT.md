# PlantFriends Technical Debt

> **Last Updated:** December 7, 2025  
> **Status:** 85% Ready for New Features  
> **Test Coverage:** 89.59%

This document tracks known issues, technical debt, and areas for improvement. Items are prioritized by impact on hobby development.

---

## 🔴 HIGH PRIORITY - Do These First

### 1. **No Error Handling Service**

**Location:** Throughout codebase (30+ console.error calls)
**Impact:** Users see no feedback when things fail
**Effort:** 30 minutes
**Priority:** 🔥 Critical for user experience

**Files affected:**
- `src/context/auth/AuthProvider.tsx`
- `src/hooks/plants/usePlantManagement.ts`
- `src/helpers/firebase/*.ts`
- `src/hooks/search/*.ts`

**Fix:** See ACTION_PLAN.md for implementation

---

### 2. **No Error Boundaries**

**Impact:** App crashes completely if any component errors
**Effort:** 30 minutes
**Priority:** 🔥 Critical for stability

**Fix:** See ACTION_PLAN.md for ErrorBoundary component

---

### 3. **Fire-and-Forget Delete Pattern**

**Location:** `src/hooks/plants/usePlantManagement.ts:79`
**Impact:** Delete failures are silent, no rollback
**Effort:** 15 minutes
**Priority:** 🔥 Data integrity issue

**Current:**
```typescript
persistDeletePlant(plant.id).then((removed) => {
  if (!removed) {
    console.error("Failed to remove plant from firebase");
  }
});
```

**Fix:** See ACTION_PLAN.md for proper async/await pattern

---

### 4. **Missing Loading & Empty States**

**Location:** Most screens
**Impact:** No feedback during operations
**Effort:** 1 hour
**Priority:** 🔥 Poor UX

**Fix:** Create LoadingSpinner and EmptyState components (see ACTION_PLAN.md)

---

## 🟡 MEDIUM PRIORITY - Do When You Feel Like It

### 6. **Duplicate Helper Files**

**Location:** `src/helpers/` has redundant Firebase wrappers
**Impact:** Confusing which function to use
**Effort:** 30 minutes
**Priority:** 🟡 Code cleanup

**Files to review:**
- Check for duplicate Firebase helper functions
- Consolidate similar functions

---


### 8. **Inconsistent Export Patterns**

**Issue:** Mix of `export default` and named exports
**Impact:** Inconsistent import styles
**Effort:** 2 hours (if you want perfection)
**Priority:** 🟡 Consistency

**Recommendation:** Keep current pattern, just be consistent going forward

---


### 11. **Outdated React Native Navigation Pattern**

**Location:** `src/components/navigation/RootLayout.tsx`
**Issue:** Using manual auth stack switching instead of expo-router
**Impact:** More boilerplate, less type-safe navigation
**Recommendation:** Consider migrating to `expo-router` (file-based routing)

### 12. **No Centralized Theme Management**

**Location:** Scattered theme files in `src/theme/`, inline styles
**Issue:** 

---

### 10. **No Pagination/Infinite Scroll**

**Location:** Plant lists
**Impact:** Could load hundreds of plants slowly
**Effort:** 2 hours
**Priority:** 🟡 Performance (do when you have 100+ plants)

**Fix:** Implement FlatList with `onEndReached`

---

### 11. **No Accessibility Labels**

**Location:** All interactive components
**Impact:** Screen readers won't work
**Effort:** 1-2 hours
**Priority:** 🟡 Accessibility (important but can wait)

**Fix:**
```tsx
<TouchableOpacity
  accessibilityLabel="Delete plant"
  accessibilityRole="button"
  accessibilityHint="Removes this plant from your collection"
>
```

---

## 🔵 LOW PRIORITY - Someday/Maybe

### 12. **No Image Optimization**

**Impact:** Slow image loading, no caching
**Effort:** 1 hour
**When:** When you add lots of images

**Fix:** Migrate to `expo-image`

---

### 13. **No Pre-commit Hooks**

**Impact:** Can commit broken code
**Effort:** 30 minutes
**When:** If working with others

**Fix:**
```bash
yarn add -D husky lint-staged
npx husky install
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