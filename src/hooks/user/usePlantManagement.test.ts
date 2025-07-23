import React from "react";
import * as reactRedux from "react-redux";

import { act, renderHook, waitFor } from "@testing-library/react-native"; // No longer need waitFor

import { AuthContext } from "@context/auth/AuthProvider";
import getUserPlantData from "@helpers/getUserPlantData";
import savePlantToFirebase from "@helpers/savePlantToFirebase";
import { addPlant, deletePlant, updatePlant } from "@store/userPlantsSlice";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";

import { usePlantManagement } from "./usePlantManagement";

// Mock helpers and modules
jest.mock("@helpers/savePlantToFirebase");
jest.mock("@helpers/getUserPlantData", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("usePlantManagement", () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);
    jest.spyOn(React, "useContext").mockImplementation((context) => {
      if (context === AuthContext) {
        return { user: mockUser };
      }
      return React.useContext(context);
    });
  });

  describe("handleSelectPlant", () => {
    it("should set selected plant and fetch user plant data", async () => {
      // Arrange
      (getUserPlantData as jest.Mock).mockResolvedValue(mockUserPlant);
      const { result } = renderHook(() => usePlantManagement());

      // Act: Wrap the entire async action in act
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });

      // Assert: The state is fully updated after act completes
      expect(result.current.userPlant).toEqual(mockUserPlant);
      expect(result.current.selectedPlant).toEqual(mockPlant);
    });

    it("should set userPlant to null if no user data is found", async () => {
      // Arrange
      (getUserPlantData as jest.Mock).mockResolvedValue(null);
      const { result } = renderHook(() => usePlantManagement());

      // Act
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });

      // Assert
      expect(result.current.userPlant).toBeNull();
      expect(result.current.selectedPlant).toEqual(mockPlant);
    });

    it("should not fetch data if user is null", async () => {
      // Arrange
      jest.spyOn(React, "useContext").mockReturnValue({ user: null });
      const { result } = renderHook(() => usePlantManagement());

      // Act
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      
      // Assert
      expect(result.current.selectedPlant).toEqual(mockPlant);
      expect(result.current.userPlant).toBeNull();
      expect(getUserPlantData).not.toHaveBeenCalled();
    });
  }); 

  it("should handle plant attribute changes", () => {
    const { result } = renderHook(() => usePlantManagement());
    act(() => {
      result.current.handlePlantAttributeChange("name", "My Custom Monstera");
    });
    expect(result.current.customizations).toEqual({
      name: "My Custom Monstera",
    });
  });
  
  it("should handle user data changes", () => {
    const { result } = renderHook(() => usePlantManagement());
    act(() => {
      result.current.handleUserDataChange("custom_name", "My Fave Plant");
    });
    expect(result.current.userPlant).toMatchObject({
      custom_name: "My Fave Plant",
      id: expect.any(String),
    });
  });

  it("should handle saving a plant and reset state", async () => {
    // Arrange
    const newSavedPlant = { ...mockUserPlant, id: "newPlantId" };
    (savePlantToFirebase as jest.Mock).mockResolvedValue(newSavedPlant);
    const { result } = renderHook(() => usePlantManagement());
    const savePromise = await waitFor(() =>
       result.current.handleSavePlant(mockUserPlant, mockPlant)
    );

    const success = await savePromise;
    expect(success).toBe(true);

    expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
    expect(mockDispatch).toHaveBeenCalledWith(addPlant(newSavedPlant));

    await waitFor(() => {
        expect(result.current.selectedPlant).toBeNull();
      });
      expect(result.current.userPlant).toEqual(newSavedPlant);
});

  it("should dispatch deletePlant action when handleDeletePlant is called", () => {
    const { result } = renderHook(() => usePlantManagement());
    result.current.handleDeletePlant(mockUserPlant);
    expect(mockDispatch).toHaveBeenCalledWith(deletePlant(mockUserPlant.id));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  describe("handleUpdatePlant", () => {
    it("should dispatch updatePlant action if user exists", () => {
      const { result } = renderHook(() => usePlantManagement());
      const updatedPlantData = { ...mockUserPlant, custom_name: "New Name" };
      result.current.handleUpdatePlant(updatedPlantData);
      expect(mockDispatch).toHaveBeenCalledWith(updatePlant(updatedPlantData));
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it("should NOT dispatch updatePlant action if user is null", () => {
      jest.spyOn(React, "useContext").mockReturnValue({ user: null });
      const { result } = renderHook(() => usePlantManagement());
      result.current.handleUpdatePlant(mockUserPlant);
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should log an error if handleSavePlant fails", async () => {
      // Arrange
      const error = new Error("Failed to save plant");
      (savePlantToFirebase as jest.Mock).mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => usePlantManagement());
    
      // Act
      const success = await waitFor(async () => {
        return await result.current.handleSavePlant(mockUserPlant, mockPlant);
      });
    
      // Assert
      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error saving plant:", error);
    
      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it("should log an error if handleDeletePlant fails", async () => {
      // Arrange
      const error = new Error("Failed to delete plant");
      mockDispatch.mockImplementation(() => {
        throw error;
      });
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => usePlantManagement());
    
      // Act
      await waitFor(async () => {
        await result.current.handleDeletePlant(mockUserPlant);
      });
    
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error deleting plant:", error);
    
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  })
});