import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";

import { SafeAreaView } from "react-native";

import RootLayout from "@/components/navigation/RootLayout";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { setupStore } from "@/store/store";

import "./gesture-handler";

export default function App() {
  return (
    <Provider store={setupStore()}>
      <AuthProvider>
        <NavigationContainer>
          <SafeAreaView />
          <RootLayout />
        </NavigationContainer>
      </AuthProvider>
    </Provider>
  );
}
