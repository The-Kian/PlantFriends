# Step 1: Create WateringSplash Component

## Goal
Create an animated fullscreen splash component that displays when watering is logged.

## File to Create
`src/components/watering/WateringSplash.tsx`

## Implementation Steps

1) **Create the component shell**: Export `WateringSplash` with props `visible` and `onComplete` and return `null` when hidden.
2) **Set up shared values**: Add `overlayOpacity`, `dropScale`, and `messageTranslateY` using `useSharedValue`.
3) **Animate on visibility**: In `useEffect`, when `visible` becomes true, fade in the overlay, spring the drop scale, slide up the message, and start a 2.5s timer that fades out then calls `onComplete`. When `visible` is false, reset the shared values.
4) **Create animated styles**: Use `useAnimatedStyle` for overlay opacity, drop scale transform, and message translateY.
5) **Render guard**: If not visible and the overlay opacity is zero, return `null` to avoid mounting work.
6) **Compose the UI**: Fullscreen overlay with centered content, a circular icon container with the water icon, and stacked title/message text.
7) **Style**: Add styles for the overlay backdrop, content spacing, icon container shadow/elevation, and white title/message text.

## Reference Implementation

```tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface WateringSplashProps {
  visible: boolean;
  onComplete: () => void;
}

export function WateringSplash({ visible, onComplete }: WateringSplashProps) {
  const overlayOpacity = useSharedValue(0);
  const dropScale = useSharedValue(0);
  const messageTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      // Fade in overlay
      overlayOpacity.value = withTiming(1, { duration: 300 });
      
      // Scale in water drop
      dropScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      
      // Slide up message
      messageTranslateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      });

      // Auto-dismiss after 2.5 seconds
      const timer = setTimeout(() => {
        overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
          onComplete();
        });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      overlayOpacity.value = 0;
      dropScale.value = 0;
      messageTranslateY.value = 50;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropScale.value }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: messageTranslateY.value }],
  }));

  if (!visible && overlayOpacity.value === 0) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, dropStyle]}>
          <Ionicons name="water" size={80} color="#4A90E2" />
        </Animated.View>
        
        <Animated.View style={messageStyle}>
          <Text style={styles.title}>Watering Logged!</Text>
          <Text style={styles.message}>Your plant is happy 🌱</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
});
```

## Key Features
- Fade-in overlay background
- Spring animation for water drop icon (bouncy feel)
- Slide-up success message
- Auto-dismiss after 2.5 seconds
- Resets animations when not visible

## Next Step
Proceed to Step 2 to integrate this component into the PlantDetails screen.
