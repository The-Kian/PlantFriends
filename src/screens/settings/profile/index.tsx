import { NavigationProp, useNavigation } from "@react-navigation/native";
import React, { useContext, useState } from "react";

import { Alert, StyleSheet } from "react-native";

import { RootStackParamList } from "@/components/navigation/types";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import { Spacing } from "@/theme/Spacing";

const ProfileSettingsScreen = () => {
  const { user, logout, update, deleteAccount } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Invalid name", "Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    await update({ displayName: displayName.trim() });
    setIsSaving(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all your plants. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAccount(),
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>

      <ThemedText style={styles.label}>Email</ThemedText>
      <ThemedText style={styles.value}>{user?.email ?? "—"}</ThemedText>

      <TextInputField
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <ThemedButton
        onPress={handleSaveName}
        title={isSaving ? "Saving..." : "Save name"}
      />

      <ThemedButton
        onPress={() => navigation.goBack()}
        title="Go back"
        additionalStyle={styles.spaced}
      />
      <ThemedButton onPress={logout} title="Logout" additionalStyle={styles.spaced} />
      <ThemedButton
        onPress={handleDeleteAccount}
        title="Delete account"
        variant="decline"
        additionalStyle={styles.spaced}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
    gap: Spacing.medium,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
  },
  spaced: {
    marginTop: Spacing.small,
  },
});

export default ProfileSettingsScreen;
