import { useState, createContext, useEffect } from "react";
import { Alert } from "react-native";
import auth, { firebase, FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { ProviderProps } from "@/constants/genericTypes";
import { AuthContextType, defaultAuthContext } from "./AuthTypes";
// import removeTokenFromDatabase from "@components/messaging/RemoveTokenFromDatabase";
// import { getDeviceToken } from "@components/messaging/GetDeviceToken";

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: ProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>("");
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
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        Alert.alert("User not found");
      } else {
        console.error("Login error:", error);
      }
    }
    console.log("🚀 ~ file: AuthProvider.tsx:46 ~ AuthProvider ~ login success");
  };

  const register = async ({ email, password }: { email: string; password: string }): Promise<void> => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await firestore()
        .collection("users")
        .doc(user?.uid)
        .set({
          displayName: user?.displayName ?? email,
          email: email,
        });
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("That email address is already in use!");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("That email address is invalid!");
      } else {
        console.error("Registration error:", error);
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
      } catch (error: any) {
        Alert.alert("Error updating profile:", error.message);
      }
      try {
        await firestore()
          .collection("users")
          .doc(user.uid)
          .set(
            {
              displayName: displayName ?? user?.email,
              email: user.email,
            },
            { merge: true },
          );
      } catch (error: any) {
        Alert.alert("Error updating Firestore:", error.message);
      } finally {
        setUser(auth().currentUser);
      }
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // await removeTokenFromDatabase(token, user.uid);
        // await firebase.messaging().deleteToken();
        await auth().signOut();
        console.log("🚀 ~ file: AuthProvider.tsx:116 ~ logout ~ logout:");
      }
    } catch (error: any) {
      Alert.alert("Error logging out:", error.message);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}