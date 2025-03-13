import { NavigationContainer } from "@react-navigation/native";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AuthContext } from "@context/auth/AuthProvider";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";


import LoginScreen from "./login";



describe("LoginScreen", () => {
    
    const renderLoginScreen = () => {
      return render(
        <NavigationContainer>
          <AuthContext.Provider value={mockAuthContextValue}>
            <LoginScreen />
          </AuthContext.Provider>
        </NavigationContainer>
      );
    }

    const mockLogin = jest.fn();

  beforeEach(() => {
    mockLogin.mockClear();
  });

  it("renders AuthContent when not authenticating", () => {
    renderLoginScreen();

    expect(screen.getByText("Create a new user")).toBeOnTheScreen();
    expect(screen.queryByText("Logging you in...")).not.toBeOnTheScreen();
  });

  it("renders LoadingOverlay when authenticating", async () => {
    mockAuthContextValue.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderLoginScreen();

    const loginButton = screen.getByText("Log In");

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText("Logging you in...")).toBeOnTheScreen();
    });
  });

  it("returns to AuthContent after authentication completes", async () => {
    mockAuthContextValue.login.mockResolvedValue(undefined);

    renderLoginScreen();

    const loginButton = screen.getByText("Log In");

    fireEvent.press(loginButton);
    await waitFor(() => {
      expect(screen.queryByText("Logging you in...")).not.toBeOnTheScreen();
    });
    expect(screen.getByTestId("AuthContent-View")).toBeOnTheScreen();
  });
});
