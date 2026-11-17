import {
  FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";
import { getFunctions, httpsCallable } from "@react-native-firebase/functions";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
} from "react";

import { Alert, Platform } from "react-native";

import { ProviderProps } from "@/constants/genericTypes";
import {
  getAppleCredential,
  getGoogleCredential,
  hasProvider,
  signOutOfGoogle,
} from "@/helpers/auth/socialAuth";
import { setCrashReportingUser } from "@/services/CrashReporting";
import ErrorService from "@/services/ErrorService";
import { cancelAllWateringReminders } from "@/services/NotificationService";
import { unregisterForPush } from "@/services/PushRegistration";

import { AuthContextType, defaultAuthContext } from "./AuthTypes";

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

/** A short name to fall back on: the part of the email before the "@". */
function emailName(email: string): string {
  return email.split("@")[0] || email;
}

export const AuthProvider = ({ children }: ProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // While a sign-up is setting the new user's name, the auth listener must not
  // publish the user. Otherwise the household would be created (and named)
  // from an account that has no display name yet.
  const holdingUser = useRef(false);

  const publishUser = useCallback(
    (userState: FirebaseAuthTypes.User | null) => {
      setUser(userState);
      setCrashReportingUser(userState?.uid ?? null);
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (userState) => {
      if (!holdingUser.current) {
        publishUser(userState);
      }
      setInitializing(false);
    });

    // Unsubscribe on unmount
    return () => unsubscribe();
  }, [publishUser]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        await signInWithEmailAndPassword(getAuth(), email, password);
      } catch (error) {
        ErrorService.handleError(error, "Login");
      }
    },
    [],
  );

  const register = useCallback(
    async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }): Promise<void> => {
      holdingUser.current = true;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          getAuth(),
          email,
          password,
        );
        const newUser = userCredential.user;
        const name = displayName?.trim() || emailName(email);

        // The name is set before anything can read it: the user isn't
        // published until this finishes.
        try {
          await updateProfile(newUser, { displayName: name });
        } catch (error) {
          // The Users document below still carries the name.
          console.warn("Couldn't set the display name on the account:", error);
        }

        // Merge: the household setup may already have written householdId.
        await setDoc(
          doc(collection(getFirestore(), "Users"), newUser.uid),
          { displayName: name, email },
          { merge: true },
        );
      } catch (error) {
        ErrorService.handleError(error, "Registration");
      } finally {
        holdingUser.current = false;
        // Publish whoever is signed in now (nobody, if sign-up failed).
        publishUser(getAuth().currentUser);
      }
    },
    [publishUser],
  );

  /**
   * Signs in to Firebase with a Google/Apple credential and creates the
   * user's profile document the first time they sign in.
   */
  const completeSocialSignIn = useCallback(
    async (
      credential: FirebaseAuthTypes.AuthCredential,
      displayName: string | null = null,
    ) => {
      holdingUser.current = true;
      try {
        const userCredential = await signInWithCredential(
          getAuth(),
          credential,
        );
        if (!userCredential.additionalUserInfo?.isNewUser) {
          return;
        }

        const newUser = userCredential.user;
        if (displayName && !newUser.displayName) {
          await updateProfile(newUser, { displayName });
        }
        await setDoc(
          doc(collection(getFirestore(), "Users"), newUser.uid),
          {
            displayName:
              displayName ??
              newUser.displayName ??
              (newUser.email ? emailName(newUser.email) : ""),
            email: newUser.email,
          },
          { merge: true },
        );
      } finally {
        holdingUser.current = false;
        publishUser(getAuth().currentUser);
      }
    },
    [publishUser],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const credential = await getGoogleCredential();
      if (!credential) return;
      await completeSocialSignIn(credential);
    } catch (error) {
      ErrorService.handleError(error, "Google Sign-In");
    }
  }, [completeSocialSignIn]);

  const signInWithApple = useCallback(async () => {
    try {
      const result = await getAppleCredential();
      if (!result) return;
      await completeSocialSignIn(result.credential, result.displayName);
    } catch (error) {
      ErrorService.handleError(error, "Apple Sign-In");
    }
  }, [completeSocialSignIn]);

  /**
   * Renames the signed-in user. The server updates their profile, their
   * entry in the household's member list (which only it may write), and the
   * household's name if it's still the automatic one.
   */
  const update = useCallback(
    async ({ displayName }: { displayName: string }) => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) return;
      try {
        const callable = httpsCallable<
          { displayName: string },
          { displayName: string; householdName?: string }
        >(getFunctions(), "updateDisplayName");
        const result = await callable({ displayName });
        await updateProfile(currentUser, {
          displayName: result.data?.displayName ?? displayName,
        });
      } catch (error) {
        ErrorService.handleError(error, "Update Profile");
      } finally {
        publishUser(getAuth().currentUser);
      }
    },
    [publishUser],
  );

  const logout = useCallback(async () => {
    try {
      // Notifications belong to this account; don't send them to the next
      // person who signs in on this device. If this fails (say, offline),
      // signing out still goes ahead.
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        try {
          await unregisterForPush(currentUser.uid);
        } catch (error) {
          console.warn("Couldn't unregister this device from push:", error);
        }
      }
      await cancelAllWateringReminders();
      await signOutOfGoogle();
      await signOut(getAuth());
    } catch (error) {
      ErrorService.handleError(error, "Logout");
    }
  }, []);

  const resetPassword = useCallback(async ({ email }: { email: string }) => {
    try {
      await sendPasswordResetEmail(getAuth(), email);
      Alert.alert(
        "Password reset email sent",
        "Check your inbox for instructions to reset your password.",
      );
    } catch (error) {
      ErrorService.handleError(error, "Reset Password");
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    try {
      // Apple requires apps to revoke the Sign in with Apple token when the
      // account is deleted. That needs a fresh authorization code, so the
      // user confirms with Apple once more.
      if (Platform.OS === "ios" && hasProvider(currentUser, "apple.com")) {
        const appleResult = await getAppleCredential();
        if (!appleResult) return;
        if (appleResult.authorizationCode) {
          await getAuth().revokeToken(appleResult.authorizationCode);
        }
      }

      // The Cloud Function anonymises the user's plants, deletes their
      // Firestore data and deletes the auth user with the Admin SDK.
      await httpsCallable(getFunctions(), "deleteAccount")();

      await cancelAllWateringReminders();
      await signOutOfGoogle();
      await signOut(getAuth());
      Alert.alert("Account deleted", "Your account has been removed.");
    } catch (error) {
      ErrorService.handleError(error, "Delete Account");
    }
  }, []);

  const value = useMemo<AuthContextType>(
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
    [
      initializing,
      user,
      login,
      register,
      logout,
      update,
      resetPassword,
      deleteAccount,
      signInWithGoogle,
      signInWithApple,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
