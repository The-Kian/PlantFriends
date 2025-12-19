import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";

import RootLayout from "@/components/navigation/RootLayout";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { setupStore } from "@/store/store";

import "./gesture-handler";

if (__DEV__) {
  import("./src/dev/seedFakePlants")
    .then(({ seedFakePlants }) => {
      (global as Record<string, unknown>).seedFakePlants = seedFakePlants;
      // console.log("Dev: call seedFakePlants() from the JS console");
    })
    .catch((error) =>
      console.warn("Dev seedFakePlants preload failed", error),
    );
}

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
