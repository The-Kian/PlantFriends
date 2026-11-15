import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";

import { Alert, Pressable, Share, StyleSheet, View } from "react-native";

import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import TextInputField from "@/components/ui/Input/TextInputField";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { AuthContext } from "@/context/auth/AuthProvider";
import { useHousehold } from "@/context/household/HouseholdProvider";
import {
  createInvite,
  formatInviteCode,
  joinErrorMessage,
  joinHousehold,
  leaveErrorMessage,
  leaveHousehold,
  previewInvite,
  removeMember,
} from "@/helpers/household/invites";
import { useTheme } from "@/hooks/utils/useTheme";
import ErrorService from "@/services/ErrorService";
import { Spacing } from "@/theme/Spacing";

const MAX_MEMBERS = 10;

/**
 * The household's name and members, with invite, join and leave buttons.
 * Whoever set the household up can also remove members.
 */
const HouseholdCard = () => {
  const { user } = useContext(AuthContext);
  const { household } = useHousehold();
  const { colors, radius, shadow } = useTheme();

  const [inviting, setInviting] = useState(false);
  // The newest invite, shown on the card so the code can be read out or
  // copied even if the share sheet is dismissed.
  const [invite, setInvite] = useState<{ code: string; until: string } | null>(
    null,
  );
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const memberIds = household?.memberIds ?? [];
  const isCreator = !!user && household?.createdBy === user.uid;
  const nameOf = (uid: string) =>
    household?.members?.[uid]?.displayName ?? "Plant friend";

  // The provider follows the profile's householdId, so after leaving or
  // being removed the app switches to the new household by itself.
  const leave = async () => {
    setLeaving(true);
    try {
      await leaveHousehold();
    } catch (error) {
      ErrorService.handleError(error, "Leave household", {
        userMessage: leaveErrorMessage(
          error,
          "Couldn't leave. Check your connection and try again.",
        ),
      });
    } finally {
      setLeaving(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      `Leave ${household?.name ?? "this household"}?`,
      "You'll go back to a household of your own, with no plants. " +
        "Plants here stay with your housemates.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: leave },
      ],
    );
  };

  const handleRemove = (uid: string) => {
    const name = nameOf(uid);
    Alert.alert(
      `Remove ${name}?`,
      `${name} will go back to a household of their own. Plants only they ` +
        "looked after will be shared with everyone left.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(uid);
            } catch (error) {
              ErrorService.handleError(error, "Remove housemate", {
                userMessage: leaveErrorMessage(
                  error,
                  "Couldn't remove them. Check your connection and try again.",
                ),
              });
            }
          },
        },
      ],
    );
  };

  const shareInvite = (shown: { code: string; until: string }) =>
    Share.share({
      message:
        "Join my household on Plant Friends. Open Profile, tap Join a " +
        `household and enter this code: ${shown.code}. ` +
        `It works until ${shown.until}.`,
    });

  const handleInvite = async () => {
    setInviting(true);
    try {
      const created = await createInvite();
      const shown = {
        code: formatInviteCode(created.code),
        until: new Date(created.expiresAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
        }),
      };
      setInvite(shown);
      await shareInvite(shown);
    } catch (error) {
      ErrorService.handleError(error, "Invite housemate", {
        userMessage: joinErrorMessage(
          error,
          "Couldn't create an invite. Check your connection and try again.",
        ),
      });
    } finally {
      setInviting(false);
    }
  };

  const join = async () => {
    setJoining(true);
    try {
      await joinHousehold(code);
      // The provider follows the profile's householdId, so it switches itself.
      setCode("");
      setShowJoin(false);
    } catch (error) {
      ErrorService.handleError(error, "Join a household", {
        userMessage: joinErrorMessage(error),
      });
    } finally {
      setJoining(false);
    }
  };

  const handleContinue = async () => {
    setJoining(true);
    try {
      const preview = await previewInvite(code);
      const plants =
        preview.plantsMoving > 0
          ? `Your ${preview.plantsMoving} plants will move with you. `
          : "";
      Alert.alert(
        `Join ${preview.householdName}?`,
        `${plants}You'll see the plants this household shares.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Join", onPress: join },
        ],
      );
    } catch (error) {
      ErrorService.handleError(error, "Join a household", {
        userMessage: joinErrorMessage(error),
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        shadow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.large,
        },
      ]}
    >
      <ThemedText type="defaultSemiBold">{household?.name ?? "—"}</ThemedText>
      <View style={styles.members}>
        {memberIds.map((uid) => (
          <View key={uid} style={styles.memberRow}>
            <ThemedText style={styles.memberName}>
              {nameOf(uid)}
              {uid === user?.uid ? " (you)" : ""}
            </ThemedText>
            {isCreator && uid !== user?.uid ? (
              <Pressable
                onPress={() => handleRemove(uid)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${nameOf(uid)}`}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Ionicons
                  name="person-remove-outline"
                  size={20}
                  color={colors.error}
                />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {memberIds.length < MAX_MEMBERS ? (
        <ThemedButton
          title={inviting ? "Creating invite..." : "Invite housemate"}
          icon="person-add-outline"
          onPress={handleInvite}
          disabled={inviting}
          accessibilityLabel="Invite housemate"
          testID="invite-housemate"
        />
      ) : null}

      {invite ? (
        <View
          style={[
            styles.invite,
            { borderColor: colors.border, borderRadius: radius.medium },
          ]}
          testID="invite-code-box"
        >
          <ThemedText type="caption">Invite code</ThemedText>
          <ThemedText
            selectable
            style={styles.inviteCode}
            accessibilityLabel={`Invite code ${invite.code.split("").join(" ")}`}
          >
            {invite.code}
          </ThemedText>
          <ThemedText type="caption">
            Works until {invite.until}. Your housemate taps Join a household
            and enters it. Press and hold the code to copy it.
          </ThemedText>
          <ThemedButton
            title="Share code"
            icon="share-outline"
            variant="secondary"
            onPress={() =>
              shareInvite(invite).catch((error) =>
                ErrorService.handleError(error, "Share invite"),
              )
            }
            accessibilityLabel="Share code"
          />
        </View>
      ) : null}

      <ThemedButton
        title="Join a household"
        variant="secondary"
        onPress={() => setShowJoin(true)}
        accessibilityLabel="Join a household"
        testID="join-household"
      />

      {showJoin ? (
        <View style={styles.joinForm}>
          <TextInputField
            label="Invite code"
            placeholder="XXXX-XXXX"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Invite code"
          />
          <ThemedButton
            title={joining ? "Checking..." : "Continue"}
            onPress={handleContinue}
            disabled={joining || !code.trim()}
            accessibilityLabel="Continue"
            testID="join-continue"
          />
        </View>
      ) : null}

      {memberIds.length > 1 ? (
        <ThemedButton
          title={leaving ? "Leaving..." : "Leave household"}
          icon="exit-outline"
          variant="decline"
          onPress={handleLeave}
          disabled={leaving}
          accessibilityLabel="Leave household"
          testID="leave-household"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.small,
  },
  members: {
    gap: 2,
    marginBottom: Spacing.small,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  memberName: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  invite: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.medium,
    gap: Spacing.small,
    alignItems: "center",
  },
  inviteCode: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: 2,
  },
  joinForm: {
    marginTop: Spacing.small,
  },
});

export default HouseholdCard;
