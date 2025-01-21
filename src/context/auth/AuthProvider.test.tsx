import { Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import { AuthProvider, AuthContext } from "./AuthProvider";
import React, { useContext } from "react";

jest.mock("@react-native-firebase/auth");

// Custom test component to consume the context
const TestComponent = () => {
  const { initializing, user } = useContext(AuthContext);

  return (
    <>
      <Text testID="initializing">{initializing ? "true" : "false"}</Text>
      <Text testID="user">{user ? user.email : "null"}</Text>
    </>
  );
};


describe("AuthProvider", () => {
  it("handles onAuthStateChanged updates correctly", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state
    expect(getByTestId("initializing").children[0]).toBe("true");
    expect(getByTestId("user").children[0]).toBe("null");

    // Wait for state updates
    await waitFor(() => {
      expect(getByTestId("initializing").children[0]).toBe("false");
      expect(getByTestId("user").children[0]).toBe("null");
    });
  });
});
