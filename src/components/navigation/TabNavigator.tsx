import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "@screens/tabs/home";
import MyPlantsScreen from "@screens/tabs/MyPlants";

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
        name="MyPlants"
        component={MyPlantsScreen}
        options={{ tabBarLabel: "My Plants" }} 
      />
    </Tab.Navigator>
  );
}
