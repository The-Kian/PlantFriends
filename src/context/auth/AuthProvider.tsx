import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import { useState, createContext, useEffect, useMemo, useRef } from "react";

import { Alert, Platform } from "react-native";

import { ProviderProps } from "@/constants/genericTypes";
import {
  getAppleCredential,
  getGoogleCredential,
  hasProvider,
  signOutOfGoogle,
} from "@/helpers/auth/socialAuth";
import { updateDisplayName } from "@/helpers/household/invites";
import { setCrashReportingUser } from "@/services/CrashReporting";
import ErrorService from "@/services/ErrorService";
import { cancelAllWateringReminders } from "@/services/NotificationService";
import { unregisterForPush } from "@/services/PushRegistration";

import { AuthContextType, defaultAuthContext } from "./AuthTypes";


export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: ProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  // While a new account is being set up (signed in, name not yet saved),
  // sign-in events are held back. Otherwise the household would be created
  // the moment the account exists, from an email address, before the name
  // the person typed is on it.
  const settingUp = useRef(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setCrashReportingUser(userState?.uid ?? null);
      if (!settingUp.current) {
        setUser(userState);
      }
      setInitializing(false);
    });

    // Unsubscribe on unmount
    return () => subscriber();
  }, []);

  /** Runs `setup` with sign-in events held back, then shows the signed-in user. */
  const whileSettingUp = async (setup: () => Promise<void>) => {
    settingUp.current = true;
    try {
      await setup();
    } finally {
      settingUp.current = false;
      setUser(auth().currentUser);
    }
  };

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      // Wrong email or password, too many tries, offline: ErrorService has
      // a message for each.
      ErrorService.handleError(error, "Login");
    }
  };

  const register = async ({
    email,
    password,
    displayName,
  }: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<void> => {
    try {
      await whileSettingUp(async () => {
        const userCredential = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );
        const user = userCredential.user;
        const name = displayName?.trim() || undefined;

        // The name goes on the account before anything reads it, so the
        // household is "Sam's home" from the first load.
        if (name) {
          try {
            await user.updateProfile({ displayName: name });
          } catch (error) {
            console.warn("Couldn't set the display name on sign-up", error);
          }
        }

        // Merge: the household setup may already have written householdId.
        await setDoc(
          doc(collection(getFirestore(), "Users"), user?.uid),
          {
            displayName: name ?? user?.displayName ?? email.split("@")[0],
            email: email,
          },
          { merge: true },
        );
      });
    } catch (error) {
      // "Already in use", "invalid email" and the rest have their own
      // messages in ErrorService.
      ErrorService.handleError(error, "Registration");
    }
  };

  /**
   * Signs in to Firebase with a Google/Apple credential and creates the
   * user's profile document the first time they sign in.
   */
  const completeSocialSignIn = async (
    credential: FirebaseAuthTypes.AuthCredential,
    displayName: string | null = null,
  ) => {
    await whileSettingUp(async () => {
      const userCredential = await auth().signInWithCredential(credential);
      if (!userCredential.additionalUserInfo?.isNewUser) {
        return;
      }

      const newUser = userCredential.user;
      if (displayName && !newUser.displayName) {
        await newUser.updateProfile({ displayName });
      }
      const db = getFirestore();
      await setDoc(
        doc(collection(db, "Users"), newUser.uid),
        {
          displayName:
            displayName ?? newUser.displayName ?? newUser.email ?? "",
          email: newUser.email,
        },
        { merge: true },
      );
    });
  };

  const handleSocialSignInError = (error: unknown, context: string) => {
    const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
    if (nativeError.code === "auth/account-exists-with-different-credential") {
      Alert.alert(
        "Account already exists",
        "An account with this email already exists. Sign in with the method you used before.",
      );
    } else {
      ErrorService.handleError(nativeError, context);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const credential = await getGoogleCredential();
      if (!credential) return;
      await completeSocialSignIn(credential);
    } catch (error) {
      handleSocialSignInError(error, "Google Sign-In");
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await getAppleCredential();
      if (!result) return;
      await completeSocialSignIn(result.credential, result.displayName);
    } catch (error) {
      handleSocialSignInError(error, "Apple Sign-In");
    }
  };

  const update = async ({ displayName }: { displayName: string }) => {
    const user = auth().currentUser;
    if (!user) return;
    try {
      await user.updateProfile({ displayName });
      // Housemates see the name from the household, which only the server can
      // write for other members, so it goes through the function.
      await updateDisplayName(displayName);
    } catch (error) {
      ErrorService.handleError(error, "Update profile");
    } finally {
      setUser(auth().currentUser);
    }
  };

  const logout = async () => {
    try {
      // Notifications belong to this account; don't send them to the next
      // person who signs in on this device.
      const currentUser = auth().currentUser;
      if (currentUser) {
        try {
          await unregisterForPush(currentUser.uid);
        } catch (error) {
          // Offline, say. Logging out matters more than tidying the token.
          console.warn("Couldn't unregister for push while logging out", error);
        }
      }
      await cancelAllWateringReminders();
      await signOutOfGoogle();
      await auth().signOut();
    } catch (error) {
      ErrorService.handleError(error, "Log out");
    }
  };

  const resetPassword = async ({ email }: { email: string }) => {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        "Password reset email sent",
        "Check your inbox for instructions to reset your password.",
      );
    } catch (error) {
      const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      ErrorService.handleError(nativeError, "Reset Password");
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    try {
      // Apple requires apps to revoke the Sign in with Apple token when the
      // account is deleted. That needs a fresh authorization code, so the
      // user confirms with Apple once more.
      if (Platform.OS === "ios" && hasProvider(currentUser, "apple.com")) {
        const appleResult = await getAppleCredential();
        if (!appleResult) return;
        if (appleResult.authorizationCode) {
          await auth().revokeToken(appleResult.authorizationCode);
        }
      }

      // The Cloud Function anonymises the user's plants, deletes their
      // Firestore data and deletes the auth user with the Admin SDK.
      await functions().httpsCallable("deleteAccount")();

      await cancelAllWateringReminders();
      await signOutOfGoogle();
      await auth().signOut();
      Alert.alert("Account deleted", "Your account has been removed.");
    } catch (error) {
      const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      ErrorService.handleError(nativeError, "Delete Account");
    }
  };

  // The functions close over nothing that changes except `user`, so the
  // context only changes when the signed-in user or `initializing` does.
  /* eslint-disable react-hooks/exhaustive-deps */
  const value: AuthContextType = useMemo(
    () => ({
      initializing,
      user,
      setUser,
      login,
      register,
      logout,
      update,
      resetPassword,
      deleteAccount,
      signInWithGoogle,
      signInWithApple,
    }),
    [initializing, user],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
