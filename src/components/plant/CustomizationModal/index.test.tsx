import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { Alert } from "react-native";

import { IUserPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant } from "@/test-utils/MockPlant";

import PlantCustomizationModal from "./index";

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const renderComponent = (plant = mockPlant, userPlant?: IUserPlant) => {
  return render(
    <AuthContext.Provider value={{ ...mockUser, ...mockAuthContextValue }}>
      <PlantCustomizationModal
        plant={plant}
        userPlant={userPlant}
        onClose={mockOnClose}
        onSave={mockOnSave}
        displayUserPlantData={false}
        isAddingNewPlant={false}
      />
    </AuthContext.Provider>
  );
};

describe("PlantCustomizationModal", () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  it("renders correctly", () => {
    renderComponent();
    expect(screen.getByText("Customize Plant")).toBeOnTheScreen();
  });

  it("closes straight away from the backdrop when nothing was typed", () => {
    renderComponent();
    fireEvent.press(screen.getByLabelText("Dismiss"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("asks before discarding from the backdrop once something was typed", () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    renderComponent();
    fireEvent.changeText(screen.getByLabelText("Name input field"), "Monty");
    fireEvent.press(screen.getByLabelText("Dismiss"));

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "Discard this plant?",
      expect.any(String),
      expect.any(Array)
    );
    const buttons = alert.mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    buttons.find((b) => b.text === "Discard")?.onPress?.();
    expect(mockOnClose).toHaveBeenCalled();
    alert.mockRestore();
  });

  it("calls onClose when the Close button is pressed", () => {
    renderComponent();
    fireEvent.press(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onSave with correct arguments when the Save button is pressed", async () => {
    renderComponent();
    fireEvent.press(screen.getByText("Save"));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          userId: "user1",
          plantId: "1",
          custom_attributes: expect.objectContaining({}),
        }),
        mockPlant
      );
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
