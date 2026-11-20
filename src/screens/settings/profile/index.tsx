import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";

import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";

import HouseholdCard from "@/components/household/HouseholdCard";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import SwitchField from "@/components/ui/Input/SwitchField";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import ScreenHeader from "@/components/ui/Views/ScreenHeader";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useHousehold } from "@/context/household/HouseholdProvider";
import setNotificationPref from "@/helpers/firebase/setNotificationPref";
import { useTheme } from "@/hooks/utils/useTheme";
import ErrorService from "@/services/ErrorService";
import {
  getNotificationPermission,
  NotificationPermission,
  openNotificationSettings,
} from "@/services/NotificationService";
import { Spacing } from "@/theme/Spacing";

// Public URL of the hosted privacy policy (docs/PRIVACY_POLICY.md). Both app
// stores require it to be reachable from inside the app.
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

const ProfileSettingsScreen = () => {
  const { user, logout, update, deleteAccount } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { colors, radius, shadow } = useTheme();
  const { notificationPrefs } = useHousehold();
  const [permission, setPermission] =
    useState<NotificationPermission>("undetermined");

  // Checked each time the screen is shown, so coming back from the phone's
  // settings updates the hint.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNotificationPermission().then((status) => {
        if (active) setPermission(status);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const handlePrefChange = async (
    key: "reminders" | "housemateActivity",
    value: boolean
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

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Invalid name", "Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaved(false);
    const ok = await update({ displayName: displayName.trim() });
    setIsSaving(false);
    setSaved(ok);
  };

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to log in again to see your plants.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
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
      ]
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

        <ThemedText type="label" style={styles.sectionLabel}>
          Notifications
        </ThemedText>
        <View style={cardStyle}>
          {permission === "denied" ? (
            <View style={styles.hint}>
              <ThemedText type="caption">
                Notifications are turned off for PlantFriends in your phone's
                settings, so reminders can't reach you.
              </ThemedText>
              <ThemedButton
                onPress={openNotificationSettings}
                title="Open settings"
                variant="secondary"
                additionalStyle={styles.saveButton}
              />
            </View>
          ) : null}
          <SwitchField
            label="Watering reminders"
            description="When a plant is due, and a nudge the next day if it's still thirsty."
            value={notificationPrefs.reminders !== false}
            onValueChange={(value) => handlePrefChange("reminders", value)}
            disabled={permission === "denied"}
          />
          <SwitchField
            label="When a housemate waters my plants"
            description="So you know it's done and don't water it twice."
            value={notificationPrefs.housemateActivity !== false}
            onValueChange={(value) =>
              handlePrefChange("housemateActivity", value)
            }
            disabled={permission === "denied"}
          />
        </View>

        <ThemedText type="label" style={styles.sectionLabel}>
          Household
        </ThemedText>
        <HouseholdCard />

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
            onChangeText={(text) => {
              setDisplayName(text);
              setSaved(false);
            }}
          />
          {saved ? (
            <ThemedText style={styles.saved} accessibilityLiveRegion="polite">
              Saved
            </ThemedText>
          ) : null}
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
          onPress={handleLogout}
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
  hint: {
    gap: Spacing.small,
    marginBottom: Spacing.medium,
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
  saved: {
    marginBottom: Spacing.small,
    fontWeight: "600",
  },
  spaced: {
    marginTop: Spacing.large,
  },
});

export default ProfileSettingsScreen;
