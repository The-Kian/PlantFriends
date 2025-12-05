import { NavigationProp, useNavigation } from "@react-navigation/native";
import React, { useContext } from "react";

import styles from "@/common/defaultStyles";
import { RootStackParamList } from "@/components/navigation/types";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";

const ProfileSettingsScreen = () => {
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout();
  };

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type={"title"}>Profile</ThemedText>
      <ThemedButton
        onPress={() => {
          navigation.goBack();
        }}
        title="Go back"
      />
      <ThemedButton onPress={handleLogout} title="Logout" />
    </ThemedView>
  );
};

export default ProfileSettingsScreen;
