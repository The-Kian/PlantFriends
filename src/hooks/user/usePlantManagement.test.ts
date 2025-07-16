import { renderHook, waitFor } from "@testing-library/react-native";
import * as reactRedux from "react-redux";

import { AuthContext } from "@context/auth/AuthProvider";
import savePlantToFirebase from "@helpers/savePlantToFirebase";
import { addPlant, deletePlant, updatePlant } from "@store/userPlantsSlice";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";

import { usePlantManagement } from "./usePlantManagement";
import React from "react";

jest.mock("@helpers/savePlantToFirebase");

describe("usePlantManagement", () => {
  const mockDispatch = jest.fn();
  const mockUser = { uid: "user123" };

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

  it("should handle user data changes and ensure id is always a string", async () => {
    const { result } = renderHook(() => usePlantManagement());

    await waitFor(() => {
      result.current.handleUserDataChange("custom_name", "customName");
    });

    expect(result.current.userPlant).toMatchObject({
      custom_name: "customName",
      id: expect.any(String), // Ensure id is always a string
    });
  });

  it("should handle saving a plant", async () => {
    (savePlantToFirebase as jest.Mock).mockResolvedValue({
      ...mockUserPlant,
      id: "newPlantId",
    });

    const { result } = renderHook(() => usePlantManagement());

    const success = await result.current.handleSavePlant(mockUserPlant, mockPlant);

    expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
    expect(mockDispatch).toHaveBeenCalledWith(
      addPlant(expect.objectContaining({ id: "newPlantId" }))
    );
    expect(success).toBe(true);
  });
});