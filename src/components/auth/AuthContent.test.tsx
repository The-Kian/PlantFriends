import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";

import { AuthProps } from "@context/auth/AuthTypes";
import validateCredentials from "@helpers/auth/validateCredentials";

import LoginScreen from "@screens/auth/login";
import SignupScreen from "@screens/auth/signup";


import AuthContent from "./AuthContent";

jest.spyOn(Alert, "alert").mockImplementation(() => {});

jest.mock("@helpers/auth/validateCredentials", () => jest.fn());
const mockedValidateCredentials = validateCredentials as jest.MockedFunction<
  typeof validateCredentials
>;

describe("AuthContent Tests", () => {
  const mockDefaultAuthProps = {
    authScreenType: "login" as "login" | "signUp" | "update",
    credentialsInvalid: {
      email: false,
      confirmEmail: false,
      password: false,
      confirmPassword: false,
    },
    credentials: {
      email: "test@test.com",
      confirmEmail: "test@test.com",
      password: "password123",
      confirmPassword: "password123",
    },
  };

  const mockOnSubmit = jest.fn();

  const renderComponent = (props: Partial<AuthProps> = {}) => {
    return render(
      <NavigationContainer>
        <AuthContent
          {...mockDefaultAuthProps}
          onSubmit={mockOnSubmit}
          {...props}
        />
        ;
      </NavigationContainer>
    );
  };

  const renderComponentWithNavigation = (initialRouteName: string) => {
    const Stack = createStackNavigator();
    
    render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  it("renders correctly", () => {
    renderComponent();
    expect(screen.getByTestId("AuthContent-View")).toBeVisible();
  });

  it("renders AuthForm and switch to SignUp button correctly", () => {
    renderComponent();
    expect(screen.getByTestId("AuthForm-View")).toBeVisible();
    expect(screen.getByText("Create a new user")).toBeVisible();
  });

  it("renders AuthForm and switch to Login button correctly", () => {
    renderComponent({ authScreenType: "signUp" });
    expect(screen.getByText("Login instead")).toBeVisible();
  });

  it("navigates to SignUp when switch button is pressed on login screen", async () => {
    renderComponentWithNavigation("Login");

    const switchButton = screen.getByText("Create a new user");
    fireEvent.press(switchButton);

    expect(await screen.findByText("Sign Up")).toBeVisible();
  });

  it("navigates to Login when switch button is pressed on Sign Up screen", async () => {
    renderComponentWithNavigation("SignUp");

    const switchButton = screen.getByText("Login instead");
    fireEvent.press(switchButton);

    await waitFor(() => expect(screen.getByText("Log In")).toBeVisible());
  });

  it("calls onSubmit with correct credentials", () => {
    mockedValidateCredentials.mockReturnValue({ isValid: true });
    renderComponent();
    fireEvent.press(screen.getByText("Log In"));
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("displays an alert when credentials are invalid", () => {
    mockedValidateCredentials.mockReturnValue({ isValid: false });
    renderComponent();

    fireEvent.press(screen.getByText("Log In"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Invalid input",
      "Please check your entered credentials."
    );
  });
});
