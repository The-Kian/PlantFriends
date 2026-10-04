import { useContext } from "react";

import { Text } from "react-native";

import { AuthContext } from "../AuthProvider";

const AuthTestComponent = () => {
  const {
    initializing,
    user,
    login,
    register,
    update,
    logout,
    deleteAccount,
    signInWithGoogle,
    signInWithApple,
  } = useContext(AuthContext);

  return (
    <>
      <Text testID="initializing">{initializing ? "true" : "false"}</Text>
      <Text testID="user">{user ? "user.email" : "null"}</Text>
      <Text
        testID="login"
        onPress={() =>
          login({ email: "test@example.com", password: "password" })
        }
      >
        Login
      </Text>
      <Text
        testID="register"
        onPress={() =>
          register({ email: "test@example.com", password: "password" })
        }
      >
        Register
      </Text>
      <Text testID="update" onPress={() => update({ displayName: "New Name" })}>
        Update
      </Text>
      <Text testID="logout" onPress={() => logout()}>
        Logout
      </Text>
      <Text testID="deleteAccount" onPress={() => deleteAccount()}>
        Delete account
      </Text>
      <Text testID="signInWithGoogle" onPress={() => signInWithGoogle()}>
        Google
      </Text>
      <Text testID="signInWithApple" onPress={() => signInWithApple()}>
        Apple
      </Text>
    </>
  );
};

export default AuthTestComponent;
