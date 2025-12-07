# PlantFriends Architecture Documentation

## Project Overview

PlantFriends is a React Native mobile app built with Expo that helps users manage and track their houseplants. Users can search for plants, save them to their collection, and customize plant care information.

## Tech Stack

### Core
- **React Native** 0.81.5
- **Expo** ^54.0.27
- **TypeScript** ^5.9.3
- **React** 19.1.0

### State Management
- **Redux Toolkit** ^2.6.1
- **React Redux** ^9.2.0

### Navigation
- **React Navigation** (Stack & Bottom Tabs)
  - `@react-navigation/native` ^7.1.24
  - `@react-navigation/native-stack` ^7.8.5
  - `@react-navigation/bottom-tabs` ^7.8.11

### Backend
- **Firebase**
  - `@react-native-firebase/app` ^21.13.0
  - `@react-native-firebase/auth` ^21.13.0
  - `@react-native-firebase/firestore` ^21.13.0

### Testing
- **Jest** ^29.2.1
- **React Testing Library** ^12.8.1

---

## Project Structure

```
PlantFriends/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Auth-related components
│   │   ├── navigation/    # Navigation components
│   │   ├── plant/         # Plant-specific components
│   │   └── ui/            # Generic UI components (buttons, inputs, etc.)
│   │
│   ├── screens/           # Screen components (pages)
│   │   ├── auth/         # Login, signup screens
│   │   ├── tabs/         # Tab navigator screens
│   │   ├── settings/     # Settings screens
│   │   └── PlantSearch/  # Plant search & details
│   │
│   ├── context/          # React Context providers
│   │   └── auth/        # Authentication context
│   │
│   ├── store/            # Redux store & slices
│   │   ├── store.ts
│   │   └── userPlantsSlice.ts
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── plants/      # Plant-related hooks
│   │   ├── search/      # Search-related hooks
│   │   ├── user/        # User-related hooks (some are simple re-exports)
│   │   └── utils/       # Utility hooks
│   │
│   ├── helpers/          # Business logic & API calls
│   │   ├── auth/        # Auth validation
│   │   ├── firebase/    # Firebase operations
│   │   └── plants/      # Plant data fetching & mapping
│   │
│   ├── constants/        # TypeScript types & constants
│   │   ├── IPlant.ts    # Plant interfaces
│   │   └── genericTypes.tsx
│   │
│   ├── theme/            # Design system
│   │   ├── Colors.ts
│   │   ├── Fonts.ts
│   │   ├── Spacing.ts
│   │   └── index.ts
│   │
│   ├── common/           # Shared styles (⚠️ unused, needs cleanup)
│   │
│   └── test-utils/       # Testing utilities
│       ├── renderWithProviders.tsx
│       ├── MockPlant.ts
│       └── MockAuthContextValue.ts
│
├── __mocks__/            # Jest mocks
├── android/              # Android native code
├── assets/               # Images, fonts
├── jest/                 # Jest configuration
└── scripts/              # Build/utility scripts
```

---

## Data Flow

### Authentication Flow

```
┌─────────────┐
│  LoginScreen│
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  AuthProvider   │◄────►│   Firebase   │
│   (Context)     │      │     Auth     │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│   RootLayout    │──► Shows TabNavigator if authenticated
│  (Navigation)   │──► Shows Auth screens if not
└─────────────────┘
```

### Plant Management Flow

```
User Action (Search/Add Plant)
         │
         ▼
┌─────────────────────┐
│ usePlantManagement  │◄──── Custom hook orchestrates operations
└──────────┬──────────┘
           │
           ├──► usePlantCustomizations (manage form state)
           ├──► usePlantPersistence (Firebase operations)
           └──► Redux dispatch (update local state)
                    │
                    ▼
           ┌─────────────────┐
           │ userPlantsSlice │
           │  (Redux Store)  │
           └─────────────────┘
                    │
                    ▼
           UI re-renders with new data
```

### Data Persistence Strategy

1. **Optimistic Updates**: UI updates immediately
2. **Firebase Sync**: Background save to Firestore
3. **Error Recovery**: Revert UI if save fails (⚠️ not fully implemented)

---

## Key Architectural Patterns

### 1. Custom Hooks Pattern
Each feature has a dedicated hook that encapsulates logic:
- `usePlantManagement` - CRUD operations for plants
- `useUserPlants` - Fetch and sync user's plants
- `useCombinedPlantSearch` - Multi-source plant search
- `useTheme` - Theme access

### 2. Context + Redux Hybrid
- **Context**: Used for auth state (global, rarely changes)
- **Redux**: Used for user plants collection (frequent updates)

### 3. Firebase Architecture

```
Firestore Collections:
├── users/
│   └── {userId}/
│       ├── displayName
│       └── email
│
├── Plants/                  # Base plant data (shared)
│   └── {plantId}/
│       ├── name
│       ├── scientific_name
│       ├── images[]
│       └── care_info...
│
└── UserPlants/             # User's plant instances
    └── {userId}/
        └── plants/
            └── {userPlantId}/
                ├── plantId (ref to Plants)
                ├── custom_name
                ├── houseLocation
                └── custom_attributes{}
```

### 4. Component Composition

```tsx
// Screens compose layouts and feature components
<ParallaxScrollView>
  <ThemedView>
    <ThemedText>My Plants</ThemedText>
    <PlantCard 
      plant={plant}
      onPress={handlePress}
      onDelete={handleDelete}
    />
  </ThemedView>
</ParallaxScrollView>
```

---

## Design Decisions

### ✅ Good Decisions

1. **Co-located Tests**: Test files next to source files
2. **Path Aliases**: `@/` prefix for clean imports
3. **TypeScript Strict Mode**: Better type safety
4. **Custom Theme System**: Centralized design tokens
5. **Test Utilities**: Reusable test setup helpers

### ⚠️ Areas for Improvement

1. **Duplicate Files**: helpers/ has redundant files (see TECH_DEBT.md)
2. **Error Handling**: Too many console.error, no proper logging
3. **No Error Boundaries**: App crashes if component errors
4. **Mixed Export Styles**: Some default, some named exports
5. **Type Safety Gaps**: Several `any` types used

---

## Testing Strategy

### Unit Tests
- All hooks have tests
- All helper functions have tests
- Redux slice has tests

### Component Tests
- Auth components tested
- Navigation components tested
- UI components partially tested

### Integration Tests
- Auth flow tested
- Plant management flow tested

### Coverage Goals
- Target: 80%+ coverage
- Current: Check with `yarn test --coverage`

---

## State Management Decisions

### When to Use Redux vs Context

**Use Redux for:**
- User's plant collection (frequently updated)
- Data that many components need
- Data that needs to persist across navigation

**Use Context for:**
- Authentication state (changes rarely)
- Theme preferences
- Feature flags

**Use Local State for:**
- Form inputs
- UI state (modals, dropdowns)
- Temporary data

---

## API Integration

### Plant Data Sources

1. **Firebase Firestore** (primary)
   - User's saved plants
   - Verified plant database
   - Real-time sync

2. **Perenual API** (external)
   - Plant search
   - Plant details
   - API key required (see .env setup)

3. **OpenFarm API** (commented out)
   - Alternative plant data source
   - Currently disabled

---

## Navigation Structure

```
App
└── NavigationContainer
    └── RootLayout (Stack Navigator)
        │
        ├── If Authenticated:
        │   ├── Tab (Bottom Tab Navigator)
        │   │   ├── Home (Stack)
        │   │   └── MyPlants (Stack)
        │   │
        │   ├── PlantSearch (Modal Stack)
        │   ├── PlantDetails (Modal Stack)
        │   └── Profile (Modal Stack)
        │
        └── If Not Authenticated:
            ├── Login
            └── Signup
```

---

## Performance Considerations

### Current Optimizations
- Redux Toolkit (Immer for immutability)
- React Navigation lazy loading
- Test utilities for fast test runs

### Needed Improvements
- Image optimization (use expo-image)
- List pagination/virtualization
- Debounced search
- Memoization for expensive computations

---

## Security Considerations

### Current Implementation
- Firebase Authentication
- Firestore security rules (on Firebase side)
- Environment variables for API keys

### Needed Improvements
- API key validation on app start
- Rate limiting for API calls
- Input sanitization
- Sensitive data encryption

---

## Deployment

### Development
```bash
yarn start          # Start Expo dev server
yarn android        # Run on Android
yarn ios           # Run on iOS
yarn test          # Run tests
yarn lint          # Lint code
```

### Production
- Uses EAS Build (Expo Application Services)
- Android: `com.thekian.plantfriends`
- iOS: `com.thekian.plantfriends`
- Project ID: `449973a1-5199-4404-834e-afb4fa814e75`

---

## Future Considerations

### Potential Improvements
1. **Migration to expo-router**: File-based routing (more type-safe)
2. **NativeWind/Tailwind**: Utility-first styling
3. **React Query**: Better async state management
4. **Expo Image**: Better image performance
5. **Sentry**: Error tracking
6. **Reanimated**: Better animations

### Feature Ideas
- Push notifications for watering reminders
- Photo upload for plants
- Plant health tracking
- Community features
- Plant care tips

---

## Contributing Guidelines

### Before Starting Work
1. Read TECH_DEBT.md
2. Check if there are duplicate files
3. Use existing patterns (hooks, helpers, components)
4. Write tests for new features
5. Update documentation

### Code Style
- Use TypeScript
- Follow ESLint rules
- Use existing test utilities
- Co-locate tests with code
- Use path aliases (`@/`)

### Commit Messages
```
feat: Add plant watering reminder
fix: Resolve duplicate plant search results
refactor: Remove duplicate Firebase helpers
test: Add tests for plant management
docs: Update architecture documentation
```
