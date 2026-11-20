import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";

import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/utils/useTheme";

interface PlantImageProps {
  uri: string | null | undefined;
  /** Size, radius and so on, used for both the photo and the placeholder. */
  style: StyleProp<ViewStyle>;
  iconSize: number;
}

/**
 * A plant's photo, or the leaf placeholder when there is none or it won't
 * load (a dead link, no connection).
 */
export function PlantImage({ uri, style, iconSize }: PlantImageProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  // A different plant gets a fresh try.
  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View
        style={[style, styles.placeholder, { backgroundColor: colors.primaryMuted }]}
        testID="plant-image-placeholder"
      >
        <Ionicons name="leaf" size={iconSize} color={colors.primary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style as never}
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});
