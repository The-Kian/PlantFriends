import { renderHook, waitFor } from "@testing-library/react-native";

import { AuthContext } from "@context/auth/AuthProvider";
import getUserPlantData from "@helpers/getUserPlantData";
import savePlantToFirebase from "@helpers/savePlantToFirebase";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";

import usePlantDetails from "./usePlantDetails";

jest.mock("@helpers/getUserPlantData");
jest.mock("@helpers/savePlantToFirebase");

describe("usePlantDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={mockAuthContextValue}>
      {children}
    </AuthContext.Provider>
  );

  it("should initialize with null selectedPlant and undefined userPlant", () => {
    const { result } = renderHook(() => usePlantDetails());

    expect(result.current.selectedPlant).toBeNull();
    expect(result.current.userPlant).toBeUndefined();
  });

  it("should update selectedPlant when handleSelectPlant is called and a user is logged in", async () => {
    (getUserPlantData as jest.Mock).mockResolvedValue(mockUserPlant);
    const { result } = renderHook(() => usePlantDetails(), {
      wrapper: authWrapper,
    });

    await waitFor(() => {
      result.current.handleSelectPlant(mockPlant);
    });

    expect(result.current.selectedPlant).toEqual(mockPlant);
    expect(result.current.userPlant).toEqual(mockUserPlant);
    expect(getUserPlantData).toHaveBeenCalledWith(mockUser.uid, mockPlant.id);
  });

  it("should save plant and reset selectedPlant when handleSaveToFirebase is called", async () => {
    const { result } = renderHook(() => usePlantDetails(), {
      wrapper: authWrapper,
    });

    await waitFor(() => {
      result.current.handleSelectPlant(mockPlant);
    });

    // Then save it
    await waitFor(() => {
      result.current.handleSaveToFirebase(mockUserPlant, mockPlant);
    });

    expect(savePlantToFirebase).toHaveBeenCalledWith(
      mockUserPlant,
      mockPlant,
      mockUser
    );
    expect(result.current.selectedPlant).toBeNull();
  });

  it("should reset selectedPlant when closeModal is called", async () => {
    const { result } = renderHook(() => usePlantDetails());

    await waitFor(() => {
      result.current.handleSelectPlant(mockPlant);
    });
    expect(result.current.selectedPlant).toEqual(mockPlant);
    await waitFor(() => {
      result.current.closeModal();
    });
    expect(result.current.selectedPlant).toBeNull();
  });
});
