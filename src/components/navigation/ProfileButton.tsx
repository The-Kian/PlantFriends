
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";

import { TouchableOpacity, StyleSheet, useColorScheme } from "react-native";

import { Colors } from "@theme/Colors";

import { RootStackParamList } from "./types";


const ProfileButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();

  const handlePress = () => {
    navigation.navigate("Profile");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      testID="profile-button"
    >
      <Ionicons
        name="person-circle-outline"
        size={24}
        color={Colors[colorScheme ?? "light"].icon}
        testID="profile-icon"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 5,
  },
});

export default ProfileButton;
