import React, { useContext, useState } from "react";

import { Alert, Share, StyleSheet, View } from "react-native";

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
  previewInvite,
} from "@/helpers/household/invites";
import { useTheme } from "@/hooks/utils/useTheme";
import ErrorService from "@/services/ErrorService";
import { Spacing } from "@/theme/Spacing";

const MAX_MEMBERS = 10;

/** The household's name and members, with invite and join buttons. */
const HouseholdCard = () => {
  const { user } = useContext(AuthContext);
  const { household } = useHousehold();
  const { colors, radius, shadow } = useTheme();

  const [inviting, setInviting] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const memberIds = household?.memberIds ?? [];

  const handleInvite = async () => {
    setInviting(true);
    try {
      const invite = await createInvite();
      const until = new Date(invite.expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });
      await Share.share({
        message:
          "Join my household on Plant Friends. Open Profile, tap Join a " +
          `household and enter this code: ${formatInviteCode(invite.code)}. ` +
          `It works until ${until}.`,
      });
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
          <ThemedText key={uid}>
            {household?.members?.[uid]?.displayName ?? "Plant friend"}
            {uid === user?.uid ? " (you)" : ""}
          </ThemedText>
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
  joinForm: {
    marginTop: Spacing.small,
  },
});

export default HouseholdCard;
