
```typescript
// src/context/auth/AuthProvider.tsx
import { logError, showErrorToUser } from '@/services/errorLogger';

const login = async ({ email, password }: LoginCredentials) => {
  try {
    await auth().signInWithEmailAndPassword(email, password);
  } catch (error) {
    const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
    const message = getAuthErrorMessage(nativeError.code);
    
    logError(error, { 
      screen: 'Login',
      action: 'login',
      userId: email 
    });
    
    showErrorToUser(message);
  }
};

const getAuthErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'Invalid email address',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password is too weak',
    'auth/too-many-requests': 'Too many attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
  };
  return messages[code] || 'An unexpected error occurred. Please try again.';
};
```

### Phase 2.2: Plant Management (2 hours)
```typescript
// src/hooks/plants/usePlantManagement.ts
import { logError, showErrorToUser } from '@/services/errorLogger';

const handleSavePlant = async (
  updatedUserPlant: IUserPlant,
  plant: IPlant,
) => {
  try {
    const savedPlant = await persistSavePlant(updatedUserPlant, plant);
    if (savedPlant) {
      dispatch(addPlant(savedPlant));
      setUserPlant(savedPlant);
      setSelectedPlant(null);
      return true;
    }
    
    showErrorToUser('Failed to save plant. Please try again.');
    return false;
  } catch (error) {
    logError(error, {
      action: 'savePlant',
      userId: user?.uid,
      plantId: plant.id,
    });
    
    showErrorToUser('Failed to save plant. Please try again.');
    return false;
  }
};

const handleDeletePlant = async (plant: IUserPlant) => {
  try {
    // Optimistically remove from UI
    dispatch(deletePlant(plant.id));
    
    // Try to delete from backend
    const removed = await persistDeletePlant(plant.id);
    
    if (!removed) {
      // Rollback on failure
      dispatch(addPlant(plant));
      showErrorToUser('Failed to delete plant from server');
      logError(new Error('Failed to remove plant from Firebase'), {
        action: 'deletePlant',
        userId: user?.uid,
        plantId: plant.id,
      });
      return false;
    }
    
    return true;
  } catch (error) {
    // Rollback on error
    dispatch(addPlant(plant));
    
    logError(error, {
      action: 'deletePlant',
      userId: user?.uid,
      plantId: plant.id,
    });
    
    showErrorToUser('Failed to delete plant. Please try again.');
    return false;
  }
};
```

### Phase 2.3: Firebase Helpers (2 hours)
Replace all `console.error` in:
- `src/helpers/firebase/fetchFirebasePlants.ts`
- `src/helpers/firebase/saveToFirebase/*.ts`
- `src/helpers/firebase/removeUserPlantFromFirebase.ts`
- `src/helpers/firebase/fetchFirebasePlantById.ts`

### Phase 2.4: Search Hooks (1 hour)
- `src/hooks/search/useCombinedPlantSearch.ts`
- `src/hooks/search/useFirebasePlantSearch.ts`

---

## 📅 Day 3: TypeScript Cleanup (6 hours)

### Phase 3.1: Define External API Types (2 hours)

```typescript
// src/types/externalApis.ts

export interface OpenFarmAttributes {
  name: string;
  slug: string;
  binomial_name?: string;
  common_names?: string[];
  description?: string;
  sun_requirements?: string;
  sowing_method?: string;
  spread?: number;
  row_spacing?: number;
  height?: number;
  images?: Array<{
    id: number;
    image_url: string;
    thumbnail_url: string;
  }>;
}

export interface OpenFarmPlant {
  id: string;
  type: 'crops';
  attributes: OpenFarmAttributes;
}

export interface OpenFarmResponse {
  data: OpenFarmPlant[];
  links: {
    self: string;
    first?: string;
    last?: string;
  };
}

export interface PerenualPlant {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name: string[];
  cycle?: string;
  watering?: string;
  sunlight?: string[];
  default_image?: {
    thumbnail?: string;
    small_url?: string;
    medium_url?: string;
    original_url?: string;
  };
}

export interface PerenualAPIResponse {
  data: PerenualPlant[];
  to: number;
  per_page: number;
  current_page: number;
  from: number;
  last_page: number;
  total: number;
}
```

### Phase 3.2: Update Mappers (1 hour)
```typescript
// src/helpers/plants/plantAPI/mapOpenFarmPlantToIPlant.ts
import { OpenFarmPlant } from '@/types/externalApis';
import { IPlant } from '@/constants/IPlant';

export const mapOpenFarmPlantToIPlant = (plant: OpenFarmPlant): IPlant => {
  const { id, attributes } = plant;
  
  return {
    id: id,
    name: attributes.name,
    slug: attributes.slug,
    scientific_name: attributes.binomial_name ? [attributes.binomial_name] : undefined,
    common_names: attributes.common_names,
    description: attributes.description,
    sun_requirements: attributes.sun_requirements,
    images: attributes.images
      ? attributes.images.map((img) => img.image_url).filter(Boolean)
      : undefined,
    contributedBy: 'openfarm',
    isVerified: true,
  };
};
```

### Phase 3.3: Remove Type Assertions (2 hours)
Find and fix all instances of:
- `(variable as any)`
- `as unknown as Type`
- Functions with `any` parameters

```bash
# Find all any usage
grep -r ": any" src/ --include="*.ts" --include="*.tsx"
grep -r "as any" src/ --include="*.ts" --include="*.tsx"
```

### Phase 3.4: Remove React.FC (1 hour)
```typescript
// Before
const PlantCard: React.FC<PlantCardProps> = ({ plant, onPress, onDelete }) => {

// After
const PlantCard = ({ plant, onPress, onDelete }: PlantCardProps) => {
```

---

## 📅 Day 4: Code Quality & Consistency (6 hours)

### Phase 4.1: Add Prettier (1 hour)
```bash
yarn add -D prettier
```

✅ Config already created

```bash
# Format all files
yarn prettier --write "src/**/*.{ts,tsx,json,md}"

# Add to package.json scripts
"format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\""
```

### Phase 4.2: Standardize Exports (2 hours)

**Decision: Use named exports for everything except screens**

```typescript
// ✅ Components, hooks, helpers - named exports
export const PlantCard = ({ ... }) => { ... };
export const usePlantManagement = () => { ... };
export const fetchFirebasePlants = async () => { ... };

// ✅ Screens - default exports (React Navigation convention)
export default function MyPlantsScreen() { ... }

// ❌ No default exports for utilities
```

Update all files to follow this pattern.

### Phase 4.3: Consolidate Theme Usage (1 hour)

Audit all inline `StyleSheet.create`:
- Move repeated styles to theme
- Ensure consistent spacing/colors
- Remove hardcoded values

### Phase 4.4: Add Pre-commit Hooks (30 min)
```bash
yarn add -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Phase 4.5: Update Tests (1.5 hours)
- Remove `/* eslint-disable @typescript-eslint/no-explicit-any */` from tests
- Fix any types in test files
- Ensure all tests still pass

---

## 📅 Day 5: Loading & Error States (6 hours)

### Phase 5.1: Create Loading Component (30 min)
```tsx
// src/components/ui/Loading/LoadingSpinner.tsx
export const LoadingSpinner = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} />
  </View>
);

// src/components/ui/Empty/EmptyState.tsx
export const EmptyState = ({ 
  title, 
  message, 
  icon 
}: EmptyStateProps) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={64} />
    <ThemedText type="title">{title}</ThemedText>
    <ThemedText>{message}</ThemedText>
  </View>
);
```

### Phase 5.2: Add to All Screens (3 hours)
Update each screen:
- MyPlantsScreen
- PlantSearchScreen
- PlantSearchResults
- ProfileSettingsScreen

Pattern:
```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (data.length === 0) return <EmptyState />;
return <DataView />;
```

### Phase 5.3: Image Optimization (2 hours)
```bash
yarn add expo-image
```

Replace all `<Image>` with `<ExpoImage>`:
```tsx
import { Image } from 'expo-image';

<Image
  source={imageUri}
  placeholder={require('@assets/images/plant-placeholder.png')}
  contentFit="cover"
  transition={200}
  onError={(error) => logError(error)}
/>
```

### Phase 5.4: Test All Screens (30 min)

---

## 📅 Day 6: Accessibility & Polish (4 hours)

### Phase 6.1: Add Accessibility Labels (2 hours)

Audit all interactive components:
```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Delete plant"
  accessibilityHint="Removes this plant from your collection"
  onPress={handleDelete}
>
```

### Phase 6.2: Toast/Snackbar System (1 hour)
```bash
yarn add react-native-toast-message
```

Replace all `Alert.alert` with toast system.

### Phase 6.3: Final Testing (1 hour)
- Test all user flows
- Test accessibility with TalkBack/VoiceOver
- Verify all error states
- Verify all loading states

---

## 📅 Day 7: Documentation & CI/CD (4 hours)

### Phase 7.1: Verify Documentation (1 hour)
- ✅ README.md complete
- ✅ ARCHITECTURE.md complete
- ✅ TECH_DEBT.md complete
- ✅ AMATEUR_SIGNALS.md complete
- ✅ .env.example created
- Add inline code comments where needed

### Phase 7.2: Set Up CI/CD (2 hours)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn lint
      - run: yarn test
      - run: yarn format:check
```

### Phase 7.3: Final Audit (1 hour)
Run all checks:
```bash
yarn lint
yarn test --coverage
yarn format:check
yarn android  # Full app test
```

---

## ✅ Success Checklist

### Critical (Must Complete)
- [ ] All duplicate files removed
- [ ] All console.* replaced with logError
- [ ] Error boundaries added
- [ ] Redux store fixed
- [ ] Environment validation added
- [ ] All `any` types removed
- [ ] React.FC removed
- [ ] Commented code deleted

### High Priority (Should Complete)
- [ ] Prettier configured and run
- [ ] Pre-commit hooks added
- [ ] Export patterns standardized
- [ ] Loading states added
- [ ] Error states added
- [ ] Image optimization (expo-image)
- [ ] Fire-and-forget fixed

### Medium Priority (Nice to Have)
- [ ] Accessibility labels added
- [ ] Toast system implemented
- [ ] CI/CD pipeline set up
- [ ] Test coverage > 80%
- [ ] Dead code removed
- [ ] Theme consolidated

---

## 📊 Metrics to Track

### Before Cleanup
```bash
# Count issues
grep -r "console\." src/ | wc -l
grep -r ": any" src/ | wc -l
find src/helpers -name "*.ts" | sort | uniq -d
yarn test --coverage  # Note coverage %
```

### After Cleanup
```bash
# Should be zero or near-zero
grep -r "console\." src/ --exclude="*.test.*" | wc -l  # → 0
grep -r ": any" src/ --exclude="*.test.*" | wc -l      # → 0
find src/helpers -name "*.ts" | sort | uniq -d         # → empty
yarn test --coverage                                    # → 80%+
```

---

## 🚨 Gotchas & Common Issues

1. **Tests break after removing duplicates**: Update test imports first
2. **Import cycles**: May surface after consolidating files
3. **TypeScript errors**: May find real bugs when removing `any`
4. **Performance**: App may be slower initially (add memoization later)
5. **Breaking changes**: Some components may need prop updates

---

## 💡 Pro Tips

1. **Work in branches**: Create a branch for each day's work
2. **Commit often**: Commit after each major change
3. **Run tests frequently**: Catch issues early
4. **Use git stash**: When switching between tasks
5. **Take breaks**: This is intensive work!

---

## 🎯 Final Result

After 7 days, your codebase will:
- ✅ Have zero duplicate files
- ✅ Have proper error handling throughout
- ✅ Be fully type-safe (no `any`)
- ✅ Have consistent code style
- ✅ Have loading/error/empty states
- ✅ Have proper logging
- ✅ Be accessible
- ✅ Have professional documentation
- ✅ Be ready for new features

**You'll be proud to show this code in interviews or to other developers! 🚀**
