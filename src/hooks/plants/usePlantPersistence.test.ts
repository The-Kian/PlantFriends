import { renderHook } from "@testing-library/react-native";

import removeUserPlantFromFirebase from "@/helpers/firebase/removeUserPlantFromFirebase";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";

import usePlantPersistence from "./usePlantPersistence";

jest.mock("@/helpers/firebase/savePlantToFirebase");
jest.mock("@/helpers/firebase/removeUserPlantFromFirebase");
jest.mock("@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase");

describe("usePlantPersistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("persistSavePlant", () => {
    it("should call savePlantToFirebase with user when user exists", async () => {
      (savePlantToFirebase as jest.Mock).mockResolvedValue(mockUserPlant);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      const savedPlant = await result.current.persistSavePlant(
        mockUserPlant,
        mockPlant,
      );

      expect(savePlantToFirebase).toHaveBeenCalledWith(
        mockUserPlant,
        mockPlant,
        mockUser,
      );
      expect(savedPlant).toEqual(mockUserPlant);
    });

    it("should return null when user is null", async () => {
      const { result } = renderHook(() => usePlantPersistence(null));

      const savedPlant = await result.current.persistSavePlant(
        mockUserPlant,
        mockPlant,
      );

      expect(savePlantToFirebase).not.toHaveBeenCalled();
      expect(savedPlant).toBeUndefined();
    });

    it("should propagate error from savePlantToFirebase", async () => {
      const error = new Error("Firebase save failed");
      (savePlantToFirebase as jest.Mock).mockRejectedValue(error);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      await expect(
        result.current.persistSavePlant(mockUserPlant, mockPlant),
      ).rejects.toThrow("Firebase save failed");
    });
  });

  describe("persistDeletePlant", () => {
    it("should call removeUserPlantFromFirebase with user when user exists", async () => {
      (removeUserPlantFromFirebase as jest.Mock).mockResolvedValue(true);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      const removed = await result.current.persistDeletePlant(mockUserPlant.id);

      expect(removeUserPlantFromFirebase).toHaveBeenCalledWith(
        mockUserPlant.id,
        mockUser,
      );
      expect(removed).toBe(true);
    });

    it("should return false when user is null", async () => {
      const { result } = renderHook(() => usePlantPersistence(null));

      const removed = await result.current.persistDeletePlant(mockUserPlant.id);

      expect(removeUserPlantFromFirebase).not.toHaveBeenCalled();
      expect(removed).toBe(false);
    });

    it("should propagate error from removeUserPlantFromFirebase", async () => {
      const error = new Error("Firebase delete failed");
      (removeUserPlantFromFirebase as jest.Mock).mockRejectedValue(error);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      await expect(
        result.current.persistDeletePlant(mockUserPlant.id),
      ).rejects.toThrow("Firebase delete failed");
    });
  });

  describe("persistUpdatePlant", () => {
    it("should call saveUserPlantToFirebase with user when user exists", async () => {
      (saveUserPlantToFirebase as jest.Mock).mockResolvedValue(true);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      const updated = await result.current.persistUpdatePlant(mockUserPlant);

      expect(saveUserPlantToFirebase).toHaveBeenCalledWith(
        mockUserPlant,
        mockUser,
      );
      expect(updated).toBe(true);
    });

    it("should return false when user is null", async () => {
      const { result } = renderHook(() => usePlantPersistence(null));

      const updated = await result.current.persistUpdatePlant(mockUserPlant);

      expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
      expect(updated).toBe(false);
    });

    it("should propagate error from saveUserPlantToFirebase", async () => {
      const error = new Error("Firebase update failed");
      (saveUserPlantToFirebase as jest.Mock).mockRejectedValue(error);
      const { result } = renderHook(() => usePlantPersistence(mockUser));

      await expect(
        result.current.persistUpdatePlant(mockUserPlant),
      ).rejects.toThrow("Firebase update failed");
    });
  });
});
