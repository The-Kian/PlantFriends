
import { useColorScheme } from "react-native";

import { renderHook, waitFor } from "@testing-library/react-native";

import { darkTheme, lightTheme } from "@theme/index";


import { useTheme } from "./useTheme";

jest.mock("react-native", () => ({
  useColorScheme: jest.fn(),
}));

describe("useTheme", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it("should return the light theme by default", () => {
      const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(lightTheme);
  });

  it("should return the dark theme when the color scheme is dark", async () => {
    (useColorScheme as jest.Mock).mockReturnValueOnce("dark");
    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current).toBe(darkTheme);
    });
  });
});
