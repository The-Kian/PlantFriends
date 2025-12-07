# PlantFriends Action Plan - Hobby Edition 🌱

> **Last Updated:** December 7, 2025  
> **Status:** Ready to build features! 85% foundation complete  
> **Test Coverage:** 89.59% (164 passing tests)

---

## 🎯 Current State

### ✅ What's Working Great
- Strong architecture with clear patterns
- Excellent test coverage (89.59%)
- Auth & Firebase integration working
- Basic plant CRUD operations
- Custom hooks for all major features
- Good documentation (ARCHITECTURE.md, TECH_DEBT.md)

### 🔧 What Needs Work
- Error handling (console.errors everywhere)
- No error boundaries
- Missing loading/empty states
- Some fire-and-forget patterns

---

## 🚀 Build Plan (Pick What Excites You!)

### **Weekend Project 1: Fix The Foundations (2-3 hours)**
*Do this first - makes everything else easier*

**Saturday Morning:**
```typescript
// src/hooks/plants/usePlantManagement.ts
1. **Create Error Service** (30 min)
   ```bash
   # Create src/services/errorLogger.ts
   ```
   - Toast notifications for user feedback
   - Console logging for development
   - Optional: Sentry integration later

2. **Add Error Boundary** (30 min)
   - Wrap app root
   - Show friendly error screen
   - Log errors properly

3. **Fix Delete Operation** (30 min)
   - `src/hooks/plants/usePlantManagement.ts`
   - Await deletion properly
   - Handle rollback on failure

4. **Add Loading/Empty States** (60 min)
   - Create `<LoadingSpinner />` component
   - Create `<EmptyState />` component
   - Use in plant lists

---

### **Weekend Project 2: Code Cleanup (2-3 hours)**
*Optional but feels good*

**Sunday Afternoon:**
1. Remove duplicate helpers (30 min)
2. Delete unused `src/common/` folder (5 min)
3. Clean up console.logs in tests (15 min)
4. Add .prettierrc config (10 min)

---

### **Fun Feature Projects (Pick One Per Weekend!)**

#### **Option A: Better Plant Cards** (3-4 hours)
- Add plant images
- Swipe to delete
- Favorite toggle
- Health status indicator
*Great visual impact!*

#### **Option B: Watering Tracker** (4-5 hours)
- Mark as watered button
- Show days since last watered
- Simple reminder badge
- Water history list
*Most useful feature*

#### **Option C: Room Organization** (3-4 hours)
- Filter plants by room
- Room badges on cards
- Quick room switcher
- Room statistics
*Good for collections*

#### **Option D: Plant Search Polish** (2-3 hours)
- Better search results UI
- Plant detail images
- Add to favorites from search
- Recent searches
*Improves discovery*

#### **Option E: Care Journal** (4-5 hours)
- Add notes to plants
- Timestamp entries
- Edit/delete notes
- Filter by date
*Power user feature*

---

## 🛠️ Technical Debt (Do When Bored)

### Quick Wins (< 30 min each)
- [ ] Add .prettierrc file
- [ ] Fix export consistency (all named OR all default)
- [ ] Remove `src/common/defaultStyles.ts` (unused)
- [ ] Add .env.example file

### Medium Tasks (1-2 hours each)
- [ ] Add accessibility labels to buttons
- [ ] Set up husky pre-commit hooks
- [ ] Migrate to expo-image for better performance
- [ ] Add pagination to plant lists

### Nice to Have (When You Feel Like It)
- [ ] Add Sentry error tracking
- [ ] Implement image caching strategy
- [ ] Add plant import/export feature
- [ ] Dark mode improvements

---

## 📚 Reference Implementation Code

### Error Logger Service
```typescript
// src/services/errorLogger.ts
import { Alert } from 'react-native';

export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export function logError(error: unknown, context?: ErrorContext) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Development: log to console
  if (__DEV__) {
    console.error('🔴 Error:', errorMessage, context);
  }
  
  // Production: send to error tracking service (Sentry, etc.)
  // TODO: Add Sentry.captureException(error, { contexts: { custom: context } });
}

export function showErrorToast(message: string) {
  Alert.alert('Error', message, [{ text: 'OK' }]);
}
```

### Error Boundary
```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { logError } from '@/services/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, {
      screen: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});
```

### Loading/Empty States
```tsx
// src/components/ui/LoadingSpinner.tsx
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// src/components/ui/EmptyState.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  subMessage?: string;
}

export function EmptyState({ 
  icon = 'leaf-outline', 
  message, 
  subMessage 
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color="#ccc" />
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
```

### Fixed Delete Operation
```typescript
// src/hooks/plants/usePlantManagement.ts
const handleDeletePlant = async (plant: IUserPlant) => {
  try {
    // Optimistically remove from UI
    dispatch(deletePlant(plant.id));
    
    // Await deletion (not fire-and-forget)
    const removed = await persistDeletePlant(plant.id);
    
    if (!removed) {
      // Rollback on failure
      dispatch(addPlant(plant));
      showErrorToast('Failed to delete plant from server');
      logError(new Error('Delete returned false'), {
        action: 'deletePlant',
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
      plantId: plant.id,
    });
    showErrorToast('Failed to delete plant');
    return false;
  }
};
```

---

## 🎯 Hobby Development Tips

1. **Pick one thing** - Don't try to do everything at once
2. **Commit often** - Small wins feel good!
3. **Test as you go** - Keeps the 89% coverage
4. **Skip perfect** - Console.log is fine for now in some places
5. **Document later** - Build first, clean up comments later
6. **It's your hobby** - If you're not having fun, build something else!

---

## 📊 Progress Tracker

- [x] Foundation architecture
- [x] Authentication system
- [x] Basic plant CRUD
- [x] Test infrastructure
- [ ] Error handling service
- [ ] Error boundaries
- [ ] Loading states
- [ ] Pick a fun feature!

**Next Update:** When you finish Weekend Project 1!