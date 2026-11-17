import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";

import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-reanimated";

import { useTheme } from "@/hooks/utils/useTheme";

interface WateringSplashProps {
  visible: boolean;
  onComplete: () => void;
}

export const WateringSplash = ({
  visible,
  onComplete,
}: WateringSplashProps) => {
  const overlayOpacity = useSharedValue(0);
  const { colors } = useTheme();

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
  }, [visible, onComplete, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: colors.surface },
        overlayStyle,
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.waterMuted }]}
        >
          <Ionicons name="water" size={80} color={colors.water} />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Watering Logged!
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Your plant is happy
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 8,
  },
});
