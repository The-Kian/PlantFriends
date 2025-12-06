# ✅ Pre-Feature Development Checklist

Use this checklist to track progress through the cleanup process.

---

## 🚨 CRITICAL (Must Complete Before New Features)

### Error Handling Foundation
- [ ] Create `src/services/errorLogger.ts` with `logError()` function
- [ ] Install `react-native-error-boundary`: `yarn add react-native-error-boundary`
- [ ] Create `src/components/ErrorBoundary/ErrorBoundary.tsx`
- [ ] Wrap app in ErrorBoundary in `App.tsx`
- [ ] Create `src/config/env.ts` with environment validation
- [ ] Test that app throws helpful error if .env is missing

### File Structure Cleanup
- [ ] Audit all imports to find which duplicate files are used
- [ ] Delete `src/helpers/fetchFirebasePlants.ts` (old version)
- [ ] Delete `src/helpers/getUserPlantData.ts` (re-export)
- [ ] Delete `src/helpers/savePlantToFirebase.ts` (re-export)
- [ ] Delete `src/helpers/saveToFirebase/` directory (wrong location)
- [ ] Delete `src/hooks/user/` directory (all re-exports)
- [ ] Delete `src/common/defaultStyles.ts` (unused)
- [ ] Delete `src/common/styles.ts` (unused)
- [ ] Update all imports to point to canonical files
- [ ] Run tests: `yarn test` - all should pass
- [ ] Run app: `yarn android` - should work

### Redux Store Fix
- [ ] Move `const store = setupStore()` outside App component
- [ ] Test Redux still works

### Console Statement Cleanup
- [ ] Replace console.error in `src/context/auth/AuthProvider.tsx`
- [ ] Replace console.error in `src/hooks/plants/usePlantManagement.ts`
- [ ] Replace console.error in `src/helpers/firebase/fetchFirebasePlants.ts`
- [ ] Replace console.error in `src/helpers/firebase/saveToFirebase/*.ts`
- [ ] Replace console.error in `src/helpers/firebase/removeUserPlantFromFirebase.ts`
- [ ] Replace console.error in `src/hooks/search/*.ts`
- [ ] Delete console.log with emoji in `saveUserPlantToFirebase.ts`
- [ ] Replace console.warn in `useCombinedPlantSearch.ts`
- [ ] Run search: `grep -r "console\." src/ --exclude="*.test.*"` - should be empty

### Commented Code Removal
- [ ] Remove commented OpenFarm code in `fetchPlantAPI.ts`
- [ ] Remove commented dev tools in `store.ts`
- [ ] Remove any other commented code blocks

---

## 🟡 HIGH PRIORITY (Should Complete Soon)

### TypeScript Safety
- [ ] Create `src/types/externalApis.ts` with proper API types
- [ ] Update `mapOpenFarmPlantToIPlant.ts` to use OpenFarmPlant type
- [ ] Update `mapPerenualPlantToIPlant.ts` to use PerenualPlant type
- [ ] Remove `any` from `useMergedPlant.ts` type assertions
- [ ] Remove `/* eslint-disable @typescript-eslint/no-explicit-any */` from all non-test files
- [ ] Run search: `grep -r ": any" src/ --exclude="*.test.*"` - should be minimal
- [ ] Remove `React.FC` from `plantCard.tsx`
- [ ] Run type check: `yarn type-check` - should have zero errors

### Code Formatting
- [ ] Install Prettier: `yarn add -D prettier`
- [ ] Create `.prettierrc` (✅ already done)
- [ ] Create `.prettierignore` (✅ already done)
- [ ] Format all code: `yarn format`
- [ ] Add format script to package.json (✅ already done)
- [ ] Commit formatted code

### Export Consistency
- [ ] Choose export pattern (recommendation: named exports)
- [ ] Update all components to use consistent exports
- [ ] Update all hooks to use consistent exports
- [ ] Update all helpers to use consistent exports
- [ ] Update imports throughout codebase
- [ ] Test that everything still works

### Pre-commit Hooks
- [ ] Install husky: `yarn add -D husky lint-staged`
- [ ] Initialize husky: `npx husky install`
- [ ] Create pre-commit hook: `npx husky add .husky/pre-commit "npx lint-staged"`
- [ ] Add lint-staged config to package.json
- [ ] Test by making a commit

---

## 🟢 MEDIUM PRIORITY (Improves User Experience)

### Loading States
- [ ] Create `src/components/ui/Loading/LoadingSpinner.tsx`
- [ ] Add loading state to MyPlantsScreen
- [ ] Add loading state to PlantSearchScreen
- [ ] Add loading state to PlantSearchResults
- [ ] Add loading state to PlantDetailsScreen

### Error States
- [ ] Create `src/components/ui/Error/ErrorMessage.tsx`
- [ ] Add error state to all screens
- [ ] Test error scenarios

### Empty States
- [ ] Create `src/components/ui/Empty/EmptyState.tsx`
- [ ] Add empty state to MyPlantsScreen
- [ ] Add empty state to PlantSearchResults
- [ ] Test with no data

### Image Optimization
- [ ] Install expo-image: `yarn add expo-image`
- [ ] Replace Image with expo-image in PlantCard
- [ ] Replace Image with expo-image in PlantDetails
- [ ] Replace Image with expo-image in SearchResult
- [ ] Add placeholder images
- [ ] Test image loading

### Error Recovery in Plant Management
- [ ] Update `handleDeletePlant` to rollback on failure
- [ ] Update `handleSavePlant` to show proper errors
- [ ] Update `handleUpdatePlant` to show proper errors
- [ ] Test optimistic updates with network failures

---

## 🔵 LOW PRIORITY (Polish)

### Accessibility
- [ ] Add accessibilityLabel to all TouchableOpacity
- [ ] Add accessibilityHint where helpful
- [ ] Add accessibilityRole to all interactive elements
- [ ] Test with TalkBack (Android)
- [ ] Test with VoiceOver (iOS)

### Toast System
- [ ] Install toast library: `yarn add react-native-toast-message`
- [ ] Replace Alert.alert in AuthProvider
- [ ] Replace Alert.alert throughout app
- [ ] Create toast wrapper utility
- [ ] Test all toast scenarios

### CI/CD Pipeline
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add lint job
- [ ] Add test job
- [ ] Add type-check job
- [ ] Add format-check job
- [ ] Test CI pipeline

### Documentation
- [ ] ✅ README.md updated
- [ ] ✅ ARCHITECTURE.md created
- [ ] ✅ TECH_DEBT.md created
- [ ] ✅ AMATEUR_SIGNALS.md created
- [ ] ✅ ACTION_PLAN.md created
- [ ] ✅ .env.example created
- [ ] Add inline code comments where needed
- [ ] Update any outdated documentation

### Theme Consolidation
- [ ] Audit all inline StyleSheet.create
- [ ] Move common styles to theme
- [ ] Remove hardcoded colors
- [ ] Remove hardcoded spacing
- [ ] Ensure all components use theme

### Test Coverage
- [ ] Run coverage: `yarn test:coverage`
- [ ] Add tests for uncovered components
- [ ] Add tests for uncovered hooks
- [ ] Add tests for uncovered helpers
- [ ] Target: 80%+ coverage

---

## 🎯 Quick Wins (Do These First!)

Can be completed in under 1 hour total:

- [ ] Install Prettier: `yarn add -D prettier`
- [ ] Format code: `yarn format`
- [ ] Fix Redux store (move outside component)
- [ ] Delete unused files (common/*, hooks/user/*)
- [ ] Remove commented code
- [ ] Add .env validation
- [ ] Update package.json scripts (✅ already done)

**Time: ~55 minutes | Impact: Immediate professionalism boost**

---

## 📊 Progress Tracking

### Overall Completion
- Critical Issues: __ / 6 complete (__ %)
- High Priority: __ / 9 complete (__ %)
- Medium Priority: __ / 10 complete (__ %)
- Low Priority: __ / 6 complete (__ %)

### Total: __ / 31 issues resolved

---

## 🚦 Definition of Done

### Critical Phase Complete When:
- [ ] Zero duplicate files exist
- [ ] Zero console.* statements (except tests)
- [ ] Error boundary catches all errors
- [ ] App validates .env on startup
- [ ] Redux store is singleton
- [ ] All tests pass: `yarn test`
- [ ] No lint errors: `yarn lint`

### Ready for New Features When:
- [ ] All Critical items complete
- [ ] All High Priority items complete
- [ ] Test coverage > 70%
- [ ] Type-check passes: `yarn type-check`
- [ ] Code formatted: `yarn format:check`
- [ ] Documentation up to date

---

## 💡 Tips

1. **Check off items as you complete them**
2. **Commit after each section** 
3. **Run tests frequently**
4. **Take breaks between phases**
5. **Don't try to do everything at once**

---

## 🆘 Stuck? Check These

- **ACTION_PLAN.md** - Detailed step-by-step instructions
- **TECH_DEBT.md** - Full explanation of each issue
- **AMATEUR_SIGNALS.md** - Why each issue matters
- **ARCHITECTURE.md** - How code is organized

---

**Last Updated:** December 6, 2025

Mark your progress and refer back to this checklist throughout the cleanup process!
