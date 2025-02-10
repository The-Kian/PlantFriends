import { useContext } from "react";
import { AuthContext } from "../AuthProvider";
import { Text } from "react-native";

const AuthTestComponent = () => {
    const { initializing, user, login, register, update, logout } =
      useContext(AuthContext);
  
    return (
      <>
        <Text testID="initializing">{initializing ? "true" : "false"}</Text>
        <Text testID="user">{user ? user.email : "null"}</Text>
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
      </>
    );
  };

  export default AuthTestComponent;