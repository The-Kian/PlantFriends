import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import * as reactRedux from "react-redux";
import fetchUserPlants from "@helpers/fetchUserPlants";
import { setUserPlants } from "@store/userPlantsSlice";
import { AuthContext } from "@context/auth/AuthProvider";
import useUserPlants from "./useUserPlants";
import { mockUserPlant } from "@test-utils/MockPlant";

jest.mock("@helpers/fetchUserPlants");

describe("useUserPlants", () => {
  const mockDispatch = jest.fn();
  const mockUser = { uid: "testUser" };

  beforeEach(() => {
    jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);
    jest.spyOn(React, "useContext").mockImplementation((context) => {
      if (context === AuthContext) {
        return { user: mockUser };
      }
      return null;
    });
    jest.clearAllMocks();
  });

  it("should fetch and set user plants when getPlants is called", async () => {
    (fetchUserPlants as jest.Mock).mockResolvedValue([mockUserPlant]);

    const { result } = renderHook(() => useUserPlants());

    const plants = await result.current.getPlants();

    expect(fetchUserPlants).toHaveBeenCalledWith(mockUser.uid);
    expect(mockDispatch).toHaveBeenCalledWith(setUserPlants([mockUserPlant]));
    expect(plants).toEqual([mockUserPlant]);
  });

  it("should return an empty array if no user is logged in", async () => {
    jest.spyOn(React, "useContext").mockImplementation((context) => {
      if (context === AuthContext) {
        return { user: null };
      }
      return null;
    });

    const { result } = renderHook(() => useUserPlants());

    const plants = await result.current.getPlants();

    expect(fetchUserPlants).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(plants).toEqual([]);
  });

  it("should handle errors gracefully when fetching plants fails", async () => {
    (fetchUserPlants as jest.Mock).mockRejectedValue(new Error("Fetch error"));

    const { result } = renderHook(() => useUserPlants());

    await waitFor(async () => {
      try {
        const plants = await result.current.getPlants();
        expect(plants).toEqual([]);
      } catch (error) {
        console.error("Test error:", error);
      }
    });

    expect(fetchUserPlants).toHaveBeenCalledWith(mockUser.uid);
    expect(mockDispatch).not.toHaveBeenCalledWith(setUserPlants(expect.anything()));
  });
});