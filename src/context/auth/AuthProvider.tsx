import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import { useState, createContext, useEffect } from "react";

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

import { AuthContextType, defaultAuthContext } from "./AuthTypes";


export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: ProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      setCrashReportingUser(userState?.uid ?? null);

      if (initializing) {
        setInitializing(false);
      }
    });

    // Unsubscribe on unmount
    return () => subscriber();
  }, [initializing]);

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
      const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      if (nativeError.code === "auth/user-not-found") {
        Alert.alert("User not found");
      } else {
        ErrorService.handleError(nativeError, "Login");
      }
    }
  };

  const register = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;
      const db = getFirestore();

      await setDoc(doc(collection(db, "Users"), user?.uid), {
        displayName: user?.displayName ?? email,
        email: email,
      });
    } catch (error) {
      const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      if (nativeError.code === "auth/email-already-in-use") {
        Alert.alert("That email address is already in use!");
      } else if (nativeError.code === "auth/invalid-email") {
        Alert.alert("That email address is invalid!");
      } else {
        ErrorService.handleError(nativeError, "Registration");
      }
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
        displayName: displayName ?? newUser.displayName ?? newUser.email ?? "",
        email: newUser.email,
      },
      { merge: true },
    );
    setUser(auth().currentUser);
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
    if (user) {
      try {
        await user.updateProfile({
          displayName: displayName,
        });
      } catch (error) {
        const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
        Alert.alert("Error updating profile:", nativeError.message);
      }
      try {
        const db = getFirestore();
        await setDoc(
          doc(collection(db, "Users"), user.uid),
          {
            displayName: displayName ?? user?.email,
            email: user.email,
          },
          { merge: true },
        );
      } catch (error) {
        const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
        Alert.alert("Error updating Firestore:", nativeError.message);
      } finally {
        setUser(auth().currentUser);
      }
    }
  };

  const logout = async () => {
    try {
      await signOutOfGoogle();
      await auth().signOut();
    } catch (error) {
      const nativeError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
      Alert.alert("Error logging out:", nativeError.message);
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

  const value: AuthContextType = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
