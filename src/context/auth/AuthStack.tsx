import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@screens/auth/login";
import SignupScreen from "@screens/auth/signup";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignupScreen} />
    </Stack.Navigator>
  );
}
