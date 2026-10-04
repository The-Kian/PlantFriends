import React, { useContext, useState } from "react";

import { Alert, ScrollView, StyleSheet, View } from "react-native";

import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

const ProfileSettingsScreen = () => {
  const { user, logout, update, deleteAccount } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { colors, radius, shadow } = useTheme();

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
      "This will permanently delete your account and personal data. Anonymous plant care data that can't be linked back to you may be kept to improve PlantFriends. This cannot be undone.",
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

  const cardStyle = [
    styles.card,
    shadow,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.large,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Profile</ThemedText>

        {/* A "Household" section slots in above Account once sharing lands. */}
        <ThemedText type="label" style={styles.sectionLabel}>
          Account
        </ThemedText>
        <View style={cardStyle}>
          <View style={styles.row}>
            <ThemedText type="caption">Email</ThemedText>
            <ThemedText style={styles.value}>{user?.email ?? "—"}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TextInputField
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <ThemedButton
            onPress={handleSaveName}
            title={isSaving ? "Saving..." : "Save name"}
            disabled={isSaving}
            additionalStyle={styles.saveButton}
          />
        </View>

        <ThemedButton
          onPress={logout}
          title="Logout"
          icon="log-out-outline"
          variant="secondary"
          additionalStyle={styles.spaced}
        />
        <ThemedButton
          onPress={handleDeleteAccount}
          title="Delete account"
          variant="decline"
        />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.medium + 4,
    paddingBottom: Spacing.xxl,
    gap: Spacing.small,
  },
  sectionLabel: {
    marginTop: Spacing.medium,
  },
  card: {
    padding: Spacing.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    gap: 2,
    marginBottom: Spacing.small + 4,
  },
  value: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.medium,
  },
  saveButton: {
    marginTop: 0,
  },
  spaced: {
    marginTop: Spacing.large,
  },
});

export default ProfileSettingsScreen;
