import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { Pressable, StyleSheet, useColorScheme } from "react-native";

import { Colors } from "@/theme/Colors";

import { RootStackParamList } from "./types";

const ProfileButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? Colors.dark : Colors.light;

  const handlePress = () => {
    navigation.navigate("Profile");
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Profile"
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && styles.pressed,
      ]}
      testID="profile-button"
    >
      <Ionicons
        name="person-outline"
        size={20}
        color={palette.text}
        testID="profile-icon"
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});

export default ProfileButton;
