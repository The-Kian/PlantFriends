import ErrorService from "@/services/ErrorService";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";

import savePlantToFirebase from "./savePlantToFirebase";
import saveBasePlantToFirebase from "./saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "./saveToFirebase/saveUserPlantToFirebase";

jest.mock("@/services/ErrorService");
jest.mock("./saveToFirebase/saveBasePlantToFirebase", () => jest.fn());
jest.mock("./saveToFirebase/saveUserPlantToFirebase", () => jest.fn());

describe("savePlantToFirebase", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(saveBasePlantToFirebase).mockResolvedValue(true);
    jest.mocked(saveUserPlantToFirebase).mockResolvedValue(true);
  });

  it("returns null and reports unauthenticated saves without writing", async () => {
    const result = await savePlantToFirebase(mockUserPlant, mockPlant, null);

    expect(result).toBeNull();
    expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).toHaveBeenCalledWith(
      "User is not authenticated", "Save Plant",
    );
    expect(saveBasePlantToFirebase).not.toHaveBeenCalled();
    expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
  });

  it("returns null and skips the user write when the base write returns false", async () => {
    jest.mocked(saveBasePlantToFirebase).mockResolvedValue(false);

    const result = await savePlantToFirebase(mockUserPlant, mockPlant, mockUser);

    expect(result).toBeNull();
    expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlant, mockUser);
    expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
    expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).toHaveBeenCalledWith(
      "Failed to save base plant", "Save Plant",
    );
  });

  it("returns null rather than the plant when the user write returns false", async () => {
    jest.mocked(saveUserPlantToFirebase).mockResolvedValue(false);

    const result = await savePlantToFirebase(mockUserPlant, mockPlant, mockUser);

    expect(result).toBeNull();
    expect(saveUserPlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockUser);
    expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).toHaveBeenCalledWith(
      "Failed to save user plant", "Save Plant",
    );
  });

  it.each(["base", "user"])("returns null and reports a rejected %s write once", async (stage) => {
    const error = new Error("Write rejected");
    const save = stage === "base" ? saveBasePlantToFirebase : saveUserPlantToFirebase;
    jest.mocked(save).mockRejectedValue(error);

    const result = await savePlantToFirebase(mockUserPlant, mockPlant, mockUser);

    expect(result).toBeNull();
    expect(ErrorService.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorService.handleError).toHaveBeenCalledWith(error, "Save Plant");
    expect(saveUserPlantToFirebase).toHaveBeenCalledTimes(stage === "base" ? 0 : 1);
  });

  it("returns the plant only after both writes succeed", async () => {
    const result = await savePlantToFirebase(mockUserPlant, mockPlant, mockUser);

    expect(result).toBe(mockUserPlant);
    expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlant, mockUser);
    expect(saveUserPlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockUser);
    expect(ErrorService.handleError).not.toHaveBeenCalled();
  });
});
