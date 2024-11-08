import { fireEvent, render, screen } from "@testing-library/react-native";
import AuthContent from "./AuthContent";
import { AuthProps } from "@context/auth/AuthTypes";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import validateCredentials from "@helpers/auth/validateCredentials";

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
        <AuthContent {...mockDefaultAuthProps} onSubmit={mockOnSubmit} {...props} />;
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

  it('navigates to SignUp when switch button is pressed on login screen', () => {
    renderComponent();

    const switchButton = screen.getByText('Create a new user');
    fireEvent.press(switchButton);

    expect(screen.getByText('Log In')).toBeVisible();
  });

  it('navigates to Login when switch button is pressed on signUp screen', () => {
    renderComponent({ authScreenType: 'signUp' });

    const switchButton = screen.getByText('Login instead');
    fireEvent.press(switchButton);

    expect(screen.getByText('Sign Up')).toBeVisible();
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
