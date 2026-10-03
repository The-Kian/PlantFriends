import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  setDoc,
} from "@react-native-firebase/firestore";
import { useState, createContext, useEffect } from "react";

import { Alert } from "react-native";

import { ProviderProps } from "@/constants/genericTypes";
import ErrorService from "@/services/ErrorService";

import { AuthContextType, defaultAuthContext } from "./AuthTypes";


export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: ProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);

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
    const user = auth().currentUser;
    if (!user) return;

    try {
      // Delete the user's Firestore profile document first.
      const db = getFirestore();
      await deleteDoc(doc(collection(db, "Users"), user.uid));
      await user.delete();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
