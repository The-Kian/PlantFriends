import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export type CredentialsInvalidType = {
  email: boolean;
  confirmEmail: boolean;
  password: boolean;
  confirmPassword: boolean;
};

export type CredentialsType = {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  dateOfBirth: Date;
};

export type AuthProps = {
  authScreenType: "login" | "signUp" | "update";
  onSubmit: (credentials: CredentialsType) => void;
  credentialsInvalid?: CredentialsInvalidType;
};

export interface AuthContextType {
  initializing: boolean;
  user: null | FirebaseAuthTypes.User;
  setUser: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>;
  login: (props: { email: string; password: string }) => Promise<void>;
  register: (props: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  update: (props: { displayName: string }) => Promise<void>;
}

export const defaultAuthContext: AuthContextType = {
  initializing: true,
  user: null,
  setUser: () => {},
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  update: async () => {},
};
