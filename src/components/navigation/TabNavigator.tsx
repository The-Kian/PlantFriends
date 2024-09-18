import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TabTwoScreen from "@screens/tabs/explore";
import HomeScreen from "@screens/tabs/home";

export default function TabNavigator() {
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" , headerShown: false }} 
      />
      <Tab.Screen
        name="Explore"
        component={TabTwoScreen}
        options={{ tabBarLabel: "Explore", headerShown: false }} 
      />
    </Tab.Navigator>
  );
}
