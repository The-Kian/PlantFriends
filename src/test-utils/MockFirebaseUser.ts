import { FirebaseAuthTypes } from "@react-native-firebase/auth";

const mockUser: FirebaseAuthTypes.User = {
  uid: "user1",
  displayName: null,
  email: null,
  emailVerified: false,
  isAnonymous: false,
  metadata: {
    creationTime: "",
    lastSignInTime: "",
  },
  multiFactor: null,
  phoneNumber: null,
  photoURL: null,
  providerData: [],
  providerId: "",
  delete: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  getIdToken: function (forceRefresh?: boolean): Promise<string> {
    throw new Error("Function not implemented.");
  },
  getIdTokenResult: function (
    forceRefresh?: boolean,
  ): Promise<FirebaseAuthTypes.IdTokenResult> {
    throw new Error("Function not implemented.");
  },
  linkWithCredential: function (
    credential: FirebaseAuthTypes.AuthCredential,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    throw new Error("Function not implemented.");
  },
  linkWithPopup: function (
    provider: FirebaseAuthTypes.AuthProvider,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    throw new Error("Function not implemented.");
  },
  linkWithRedirect: function (
    provider: FirebaseAuthTypes.AuthProvider,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    throw new Error("Function not implemented.");
  },
  reauthenticateWithCredential: function (
    credential: FirebaseAuthTypes.AuthCredential,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    throw new Error("Function not implemented.");
  },
  reload: function (): Promise<void> {
    throw new Error("Function not implemented.");
  },
  sendEmailVerification: function (
    actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings,
  ): Promise<void> {
    throw new Error("Function not implemented.");
  },
  verifyBeforeUpdateEmail: function (
    email: string,
    actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings,
  ): Promise<void> {
    throw new Error("Function not implemented.");
  },
  toJSON: function (): object {
    throw new Error("Function not implemented.");
  },
  unlink: function (providerId: string): Promise<FirebaseAuthTypes.User> {
    throw new Error("Function not implemented.");
  },
  updateEmail: function (email: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
  updatePassword: function (password: string): Promise<void> {
    throw new Error("Function not implemented.");
  },
  updatePhoneNumber: function (
    credential: FirebaseAuthTypes.AuthCredential,
  ): Promise<void> {
    throw new Error("Function not implemented.");
  },
  updateProfile: function (
    updates: FirebaseAuthTypes.UpdateProfile,
  ): Promise<void> {
    throw new Error("Function not implemented.");
  },
  reauthenticateWithRedirect: function (
    provider: FirebaseAuthTypes.AuthProvider,
  ): Promise<void> {
    throw new Error("Function not implemented.");
  },
  reauthenticateWithPopup: function (
    provider: FirebaseAuthTypes.AuthProvider,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    throw new Error("Function not implemented.");
  },
};

export default mockUser;
