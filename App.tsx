
import { NavigationContainer } from "@react-navigation/native";

import { SafeAreaView } from "react-native";

import RootLayout from "@components/navigation/RootLayout";
import { AuthProvider } from "@context/auth/AuthProvider";


import './gesture-handler';


export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <SafeAreaView />
        <RootLayout />
      </NavigationContainer>
    </AuthProvider>
  );
}
