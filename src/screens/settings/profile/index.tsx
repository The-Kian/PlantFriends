import React, { useContext, useState } from "react";

import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";

import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import SwitchField from "@/components/ui/Input/SwitchField";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { INotificationPrefs } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useHousehold } from "@/context/household/HouseholdProvider";
import setNotificationPref from "@/helpers/firebase/setNotificationPref";
import { useTheme } from "@/hooks/utils/useTheme";
import ErrorService from "@/services/ErrorService";
import { Spacing } from "@/theme/Spacing";

// Public URL of the hosted privacy policy (docs/PRIVACY_POLICY.md). Both app
// stores require it to be reachable from inside the app.
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

const ProfileSettingsScreen = () => {
  const { user, logout, update, deleteAccount } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { colors, radius, shadow } = useTheme();
  const { household, notificationPrefs } = useHousehold();

  const handlePrefChange = async (
    key: keyof INotificationPrefs,
    value: boolean,
  ) => {
    if (!user) return;
    try {
      await setNotificationPref(user.uid, key, value);
    } catch (error) {
      ErrorService.handleError(error, "Notification Settings", {
        userMessage: "Couldn't save that setting. Please try again.",
      });
    }
  };

  // Housemates are linked by hand for now, using this ID.
  const handleShareHouseholdId = () => {
    if (!household) return;
    Share.share({ message: household.id }).catch(() => {});
  };

  const members = household
    ? household.memberIds.map((uid) => ({
        uid,
        name:
          household.members?.[uid]?.displayName ??
          (uid === user?.uid ? "You" : "Housemate"),
      }))
    : [];

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

        {household ? (
          <>
            <ThemedText type="label" style={styles.sectionLabel}>
              Household
            </ThemedText>
            <View style={cardStyle}>
              <View style={styles.row}>
                <ThemedText type="caption">Name</ThemedText>
                <ThemedText style={styles.value}>{household.name}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="caption">Members</ThemedText>
                {members.map((member) => (
                  <ThemedText key={member.uid} style={styles.value}>
                    {member.uid === user?.uid
                      ? `${member.name} (you)`
                      : member.name}
                  </ThemedText>
                ))}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <ThemedText type="caption">Household ID</ThemedText>
                <ThemedText style={styles.value} selectable>
                  {household.id}
                </ThemedText>
              </View>
              <ThemedButton
                onPress={handleShareHouseholdId}
                title="Share household ID"
                icon="share-outline"
                variant="secondary"
                additionalStyle={styles.saveButton}
              />
            </View>
          </>
        ) : null}

        <ThemedText type="label" style={styles.sectionLabel}>
          Notifications
        </ThemedText>
        <View style={cardStyle}>
          <SwitchField
            label="Watering reminders"
            description="When a plant you look after needs water."
            value={notificationPrefs.reminders !== false}
            onValueChange={(value) => handlePrefChange("reminders", value)}
          />
          <SwitchField
            label="When a housemate waters my plants"
            description="So you know it's done and don't water it twice."
            value={notificationPrefs.housemateActivity !== false}
            onValueChange={(value) =>
              handlePrefChange("housemateActivity", value)
            }
          />
        </View>

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

        {PRIVACY_POLICY_URL ? (
          <ThemedButton
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            title="Privacy policy"
            icon="document-text-outline"
            variant="secondary"
            additionalStyle={styles.spaced}
          />
        ) : null}
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
