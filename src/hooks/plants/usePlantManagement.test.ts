import React from "react";
import * as reactRedux from "react-redux";

import uuid from "react-native-uuid";

import { act, renderHook } from "@testing-library/react-native";

import { AuthContext } from "@/context/auth/AuthProvider";
import getUserPlantData from "@/helpers/firebase/getUserPlantData";
import removeUserPlantFromFirebase from "@/helpers/firebase/removeUserPlantFromFirebase";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";
import ErrorService from "@/services/ErrorService";
import { addPlant, deletePlant, updatePlant } from "@/store/userPlantsSlice";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";

import { usePlantManagement } from "./usePlantManagement";

jest.mock("@/helpers/firebase/savePlantToFirebase");
jest.mock("@/helpers/firebase/getUserPlantData");
jest.mock("@/helpers/firebase/removeUserPlantFromFirebase");
jest.mock("@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase");
jest.mock("@/services/ErrorService");

describe("usePlantManagement", () => {
  const mockDispatch = jest.fn();
  const renderManagement = (user: typeof mockUser | null = mockUser) =>
    renderHook(() => usePlantManagement(), {
      wrapper: ({ children }: React.PropsWithChildren) =>
        React.createElement(AuthContext.Provider, {
          value: { ...mockAuthContextValue, user },
          children,
        }),
    });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(reactRedux, "useDispatch").mockReturnValue(mockDispatch);
    jest.spyOn(uuid, "v4").mockReturnValue("mock-uuid" as never);
    jest.mocked(getUserPlantData).mockResolvedValue(mockUserPlant);
    jest.mocked(savePlantToFirebase).mockResolvedValue(mockUserPlant);
    jest.mocked(removeUserPlantFromFirebase).mockResolvedValue(true);
    jest.mocked(saveUserPlantToFirebase).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("handleSelectPlant", () => {
    it("sets the selected plant and fetches user plant data", async () => {
      const { result } = renderManagement();
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      expect(getUserPlantData).toHaveBeenCalledWith(mockUser.uid, mockPlant.id);
      expect(result.current.userPlant).toEqual(mockUserPlant);
      expect(result.current.selectedPlant).toEqual(mockPlant);
    });

    it("sets userPlant to null when no user data is found", async () => {
      jest.mocked(getUserPlantData).mockResolvedValue(undefined);
      const { result } = renderManagement();
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      expect(result.current.userPlant).toBeNull();
      expect(result.current.selectedPlant).toEqual(mockPlant);
    });

    it("does not fetch user data without a user", async () => {
      const { result } = renderManagement(null);
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      expect(result.current.selectedPlant).toEqual(mockPlant);
      expect(result.current.userPlant).toBeNull();
      expect(getUserPlantData).not.toHaveBeenCalled();
    });
  });

  it("handles plant attribute changes", () => {
    const { result } = renderManagement();
    act(() => {
      result.current.handlePlantAttributeChange("name", "My Custom Monstera");
    });
    expect(result.current.customizations).toEqual({ name: "My Custom Monstera" });
  });

  it("handles user data changes", () => {
    const { result } = renderManagement();
    act(() => {
      result.current.handleUserDataChange("custom_name", "My Fave Plant");
    });
    expect(result.current.userPlant).toMatchObject({
      custom_name: "My Fave Plant",
      id: expect.any(String),
    });
  });

  describe("handleSavePlant", () => {
    it("dispatches the saved plant and resets selection on success", async () => {
      const savedPlant = { ...mockUserPlant, id: "newPlantId" };
      jest.mocked(savePlantToFirebase).mockResolvedValue(savedPlant);
      const { result } = renderManagement();
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      await act(async () => {
        expect(await result.current.handleSavePlant(mockUserPlant, mockPlant)).toBe(true);
      });
      expect(savePlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockPlant, mockUser);
      expect(mockDispatch).toHaveBeenCalledWith(addPlant(savedPlant));
      expect(result.current.selectedPlant).toBeNull();
      expect(result.current.userPlant).toEqual(savedPlant);
    });

    it("preserves selection and state without dispatching on a failed save", async () => {
      jest.mocked(savePlantToFirebase).mockResolvedValue(null);
      const { result } = renderManagement();
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      await act(async () => {
        expect(await result.current.handleSavePlant(
          { ...mockUserPlant, custom_name: "Unsaved" }, mockPlant,
        )).toBe(false);
      });
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(result.current.selectedPlant).toEqual(mockPlant);
      expect(result.current.userPlant).toEqual(mockUserPlant);
      // The save helper owns reporting failures it has already handled.
      expect(ErrorService.handleError).not.toHaveBeenCalled();
    });

    it("returns false without writing when unauthenticated", async () => {
      const { result } = renderManagement(null);
      await act(async () => {
        expect(await result.current.handleSavePlant(mockUserPlant, mockPlant)).toBe(false);
      });
      expect(savePlantToFirebase).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("reports unexpected save rejections once", async () => {
      const error = new Error("Failed to save plant");
      jest.mocked(savePlantToFirebase).mockRejectedValue(error);
      const { result } = renderManagement();
      await act(async () => {
        expect(await result.current.handleSavePlant(mockUserPlant, mockPlant)).toBe(false);
      });
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
      expect(ErrorService.handleError).toHaveBeenCalledWith(error, "Save Plant");
    });
  });

  describe("handleDeletePlant", () => {
    it("persists a deletion and dispatches once on success", async () => {
      const { result } = renderManagement();
      await act(async () => {
        expect(await result.current.handleDeletePlant(mockUserPlant)).toBe(true);
      });
      expect(removeUserPlantFromFirebase).toHaveBeenCalledWith(mockUserPlant.id, mockUser);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(deletePlant(mockUserPlant.id));
    });

    it("does not write without a user and rolls back the optimistic deletion", async () => {
      const { result } = renderManagement(null);
      await act(async () => {
        expect(await result.current.handleDeletePlant(mockUserPlant)).toBe(false);
      });
      expect(removeUserPlantFromFirebase).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenNthCalledWith(1, deletePlant(mockUserPlant.id));
      expect(mockDispatch).toHaveBeenNthCalledWith(2, addPlant(mockUserPlant));
    });

    it.each([false, "reject"])("rolls back and reports failed deletion (%s)", async (failure) => {
      const error = new Error("Failed to delete plant");
      if (failure === false) {
        jest.mocked(removeUserPlantFromFirebase).mockResolvedValue(false);
      } else {
        jest.mocked(removeUserPlantFromFirebase).mockRejectedValue(error);
      }
      const { result } = renderManagement();
      await act(async () => {
        expect(await result.current.handleDeletePlant(mockUserPlant)).toBe(false);
      });
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenNthCalledWith(1, deletePlant(mockUserPlant.id));
      expect(mockDispatch).toHaveBeenNthCalledWith(2, addPlant(mockUserPlant));
      expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
      expect(ErrorService.handleError).toHaveBeenCalledWith(
        failure === false ? "Failed to remove plant from firebase" : error,
        "Delete Plant",
      );
    });
  });

  describe("handleUpdatePlant", () => {
    const updatedPlant = { ...mockUserPlant, custom_name: "New Name" };

    it("waits for persistence before updating Redux and local state", async () => {
      let resolveWrite!: (saved: boolean) => void;
      jest.mocked(saveUserPlantToFirebase).mockReturnValue(new Promise((resolve) => {
        resolveWrite = resolve;
      }));
      const { result } = renderManagement();
      let pendingUpdate!: Promise<boolean>;
      act(() => {
        pendingUpdate = result.current.handleUpdatePlant(updatedPlant);
      });
      expect(saveUserPlantToFirebase).toHaveBeenCalledWith(updatedPlant, mockUser);
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(result.current.userPlant).toBeNull();

      await act(async () => {
        resolveWrite(true);
        expect(await pendingUpdate).toBe(true);
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(updatePlant(updatedPlant));
      expect(result.current.userPlant).toEqual(updatedPlant);
    });

    it.each([false, "reject"])("does not update state after a failed write (%s)", async (failure) => {
      const error = new Error("Failed to update plant");
      if (failure === false) {
        jest.mocked(saveUserPlantToFirebase).mockResolvedValue(false);
      } else {
        jest.mocked(saveUserPlantToFirebase).mockRejectedValue(error);
      }
      const { result } = renderManagement();
      await act(async () => {
        await result.current.handleSelectPlant(mockPlant);
      });
      await act(async () => {
        expect(await result.current.handleUpdatePlant(updatedPlant)).toBe(false);
      });
      expect(saveUserPlantToFirebase).toHaveBeenCalledWith(updatedPlant, mockUser);
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(result.current.userPlant).toEqual(mockUserPlant);
      expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
      expect(ErrorService.handleError).toHaveBeenCalledWith(
        failure === false ? "Failed to update plant in firebase" : error,
        "Update Plant",
      );
    });

    it("returns false without writing or dispatching when unauthenticated", async () => {
      const { result } = renderManagement(null);
      await act(async () => {
        expect(await result.current.handleUpdatePlant(updatedPlant)).toBe(false);
      });
      expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
