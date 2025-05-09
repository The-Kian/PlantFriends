import React from "react";
import * as reactRedux from "react-redux";

import savePlantToFirebase from "@helpers/savePlantToFirebase";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";
import { renderHook, waitFor } from "@testing-library/react-native";
import { userPlantDataHandlers } from "./userPlantDataHandlers";
import { addPlant, deletePlant, updatePlant } from "@store/userPlantsSlice";
import { AuthContext } from "@context/auth/AuthProvider";

jest.mock("@helpers/savePlantToFirebase");

describe("userPlantDataHandlers", () => {
    const mockDispatch = jest.fn();
    const mockUser = { id: "user123" };

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

    it("should handle plant submission successfully", async () => {
        (savePlantToFirebase as jest.Mock).mockResolvedValue({
            ...mockUserPlant,
            id: "newPlantId",
        });

        const { result } = renderHook(() => userPlantDataHandlers());

        const success = await result.current.handlePlantSubmit(mockUserPlant, mockPlant);

        expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
        expect(mockDispatch).toHaveBeenCalledWith(
            addPlant(expect.objectContaining({ id: "newPlantId" }))
        );
        expect(success).toBe(true);
    });

    it("should handle plant submission failure", async () => {
        (savePlantToFirebase as jest.Mock).mockRejectedValue(new Error("Firebase error"));

        const { result } = renderHook(() => userPlantDataHandlers());

        const success = await result.current.handlePlantSubmit(mockUserPlant, mockPlant);

        expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(success).toBe(false);
    });

    it("should handle plant deletion", async () => {
        const { result } = renderHook(() => userPlantDataHandlers());

        await waitFor(() => {
            result.current.handleDeletePlant(mockPlant);
        });

        expect(mockDispatch).toHaveBeenCalledWith(deletePlant(mockPlant.id));
    });

    it("should handle plant update", async () => {
        const { result } = renderHook(() => userPlantDataHandlers());

        await waitFor(() => {
            result.current.handleUpdatePlant(mockUserPlant);
        });

        expect(mockDispatch).toHaveBeenCalledWith(updatePlant(mockUserPlant));
    });

    it("should log an error and return false when handlePlantSubmit encounters an error", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        (savePlantToFirebase as jest.Mock).mockRejectedValue(new Error("Submission error"));

        const { result } = renderHook(() => userPlantDataHandlers());

        const success = await result.current.handlePlantSubmit(mockUserPlant, mockPlant);

        expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error submitting plant data:", expect.any(Error));
        expect(success).toBe(false);

        consoleErrorSpy.mockRestore();
    });

    it("should log an error and return false when handleDeletePlant encounters an error", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mockDispatch.mockImplementation(() => {
            throw new Error("Deletion error");
        });

        const { result } = renderHook(() => userPlantDataHandlers());

        await result.current.handleDeletePlant(mockPlant);

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error deleting plant data:", expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it("should log an error and return false when handleUpdatePlant encounters an error", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mockDispatch.mockImplementation(() => {
            throw new Error("Update error");
        });

        const { result } = renderHook(() => userPlantDataHandlers());

        await result.current.handleUpdatePlant(mockUserPlant);

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating plant data:", expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it("should return false when user is not available", async () => {
        jest.spyOn(React, "useContext").mockImplementation((context) => {
            if (context === AuthContext) {
                return { user: null }; // Simulate no user
            }
            return null;
        });
    
        const { result } = renderHook(() => userPlantDataHandlers());
    
        const success = await result.current.handlePlantSubmit(mockUserPlant, mockPlant);
    
        expect(success).toBe(false); // Ensure it returns false
        expect(savePlantToFirebase).not.toHaveBeenCalled(); // Ensure no Firebase call
        expect(mockDispatch).not.toHaveBeenCalled(); // Ensure no dispatch
    });
});