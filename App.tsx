import './gesture-handler';


import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { SafeAreaView } from "react-native";

import { AuthProvider } from "@context/auth/AuthProvider";

import RootLayout from "@components/navigation/RootLayout";


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
