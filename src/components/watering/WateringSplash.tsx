import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface WateringSplashProps {
  visible: boolean;
  onComplete: () => void;
}

export const WateringSplash = ({
  visible,
  onComplete,
}: WateringSplashProps) => {
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
          overlayOpacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(onComplete)();
          });
      }, 2000);

      return () => clearTimeout(timer);
    }

    overlayOpacity.value = 0;
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="water" size={80} color="#4A90E2" />
        </View>

        <View>
          <Text style={styles.title}>Watering Logged!</Text>
          <Text style={styles.message}>Your plant is happy</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },
});
