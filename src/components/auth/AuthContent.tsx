import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";

import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList } from "@/components/navigation/types";
import { ThemedText } from "@/components/ui/Text/ThemedText";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { AuthProps, CredentialsType } from "@/context/auth/AuthTypes";
import validateCredentials from "@/helpers/auth/validateCredentials";
import { useTheme } from "@/hooks/utils/useTheme";
import { Spacing } from "@/theme/Spacing";

import AuthForm from "./AuthForm";
import SocialSignInButtons from "./SocialSignInButtons";
import ThemedButton from "../ui/Buttons/ThemedButton";

function AuthContent({ authScreenType, onSubmit, children }: AuthProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  function switchAuthModeHandler() {
    if (authScreenType === "login") {
      navigation.navigate("SignUp");
    } else if (authScreenType === "signUp") {
      navigation.navigate("Login");
    }
  }

  function submitHandler(credentials: CredentialsType) {
    const validationResult = validateCredentials(credentials, authScreenType);

    if (!validationResult.isValid) {
      Alert.alert("Invalid input", "Please check your entered credentials.");
      return;
    }
    onSubmit(credentials);
  }

  const isAuthScreen = authScreenType !== "update";

  return (
    <ThemedView testID={"AuthContent-View"} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isAuthScreen && { paddingTop: insets.top + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isAuthScreen && (
          <View style={styles.brand}>
            <View
              style={[
                styles.logo,
                { backgroundColor: colors.primaryMuted, borderRadius: radius.large },
              ]}
            >
              <Ionicons name="leaf" size={30} color={colors.primary} />
            </View>
            <ThemedText type="title">
              {authScreenType === "login" ? "Welcome back" : "Create account"}
            </ThemedText>
            <ThemedText type="caption">
              {authScreenType === "login"
                ? "Log in to keep your plants happy."
                : "Start tracking your plants in a minute."}
            </ThemedText>
          </View>
        )}

        <AuthForm onSubmit={submitHandler} authScreenType={authScreenType} />
        {children}

        {isAuthScreen && (
          <>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <ThemedText type="caption">or</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            <SocialSignInButtons />
            <ThemedButton
              onPress={switchAuthModeHandler}
              variant="ghost"
              title={
                authScreenType === "login" ? "Create a new user" : "Login instead"
              }
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.xxl,
  },
  brand: {
    gap: Spacing.xs,
    marginBottom: Spacing.large,
  },
  logo: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.medium,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.small + 4,
    marginTop: Spacing.large,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});

export default AuthContent;
