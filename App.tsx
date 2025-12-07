import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";

import RootLayout from "@/components/navigation/RootLayout";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { setupStore } from "@/store/store";

import "./gesture-handler";

// Create the Redux store once at module scope so it's not recreated on every render
const store = setupStore();

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationContainer>
          <RootLayout />
        </NavigationContainer>
      </AuthProvider>
    </Provider>
  );
}
