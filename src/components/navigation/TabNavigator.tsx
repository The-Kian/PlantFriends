import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TabTwoScreen from "@screens/tabs/explore";
import HomeScreen from "@screens/tabs/home";
import ProfileButton from "./ProfileButton";

export default function TabNavigator() {
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
    screenOptions={{
      headerRight: () => <ProfileButton />,
    }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home"}}
      />
      <Tab.Screen
        name="Explore"
        component={TabTwoScreen}
        options={{ tabBarLabel: "Explore" }} 
      />
    </Tab.Navigator>
  );
}
