
import { AuthContext } from "@context/auth/AuthProvider";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@test-utils/MockPlant";
import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";

import React from "react";

import PlantForm from "./";

// --- Mocks ---

// Always return 'test-uuid' for uuid.v4()
jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

// Mock useCustomizationStyles to return dummy style objects
jest.mock("@components/plant/customization/plantCustomization.styles", () => ({
  useCustomizationStyles: () => ({
    content: { padding: 10 },
    title: { fontSize: 20 },
    buttonContainer: { marginTop: 10 },
    button: { backgroundColor: "blue" },
  }),
}));

// Mock GeneralInfoSection to call onAttributeChange
jest.mock("./GeneralInfoSection", () => {
  const React = require("react");
  const { Button } = require("react-native");
  const MockGeneralInfoSection = ({ onAttributeChange }) => (
    <Button
      testID="attribute-button"
      title="Change Attribute"
      onPress={() => onAttributeChange("name", "NewName")}
    />
  );
  MockGeneralInfoSection.displayName = "MockGeneralInfoSection"
  return MockGeneralInfoSection;
});

// Mock UserDataSection to call onUserDataChange
jest.mock("./UserDataSection", () => {
  const React = require("react");
  const { Button } = require("react-native");
  const MockUserDataSection = ({ onUserDataChange }) => (
    <Button
      testID="user-data-button"
      title="Change User Data"
      onPress={() => onUserDataChange("customField", "NewValue")}
    />
  );
  MockUserDataSection.displayName = "MockUserDataSection";
  return MockUserDataSection;
});

// --- Test Suite ---

describe("PlantForm", () => {
  const mockOnSave = jest.fn();

  // Helper render function that wraps PlantForm in AuthContext
  const renderPlantForm = (
    displayUserPlantData: boolean = true,
    initialPlantData = mockPlant,
    initialUserPlantData = mockUserPlant
  ) => {
    return render(
      <AuthContext.Provider value={{ ...mockUser, ...mockAuthContextValue }}>
        <PlantForm
          initialPlantData={initialPlantData}
          initialUserPlantData={initialUserPlantData}
          onSave={mockOnSave}
          displayUserPlantData={displayUserPlantData}
        />
      </AuthContext.Provider>
    );
  };

  it('renders correctly with title "Plant Form"', () => {
    renderPlantForm();
    expect(screen.getByText("Plant Form")).toBeTruthy();
  });

  it("renders UserDataSection when displayUserPlantData is true", () => {
    renderPlantForm(true);
    expect(screen.getByText("Change User Data")).toBeTruthy();
  });

  it("does not render UserDataSection when displayUserPlantData is false", () => {
    renderPlantForm(false);
    expect(screen.queryByText("Change User Data")).toBeNull();
  });

  it("calls onSave with proper data when the Save button is pressed", async () => {
    renderPlantForm();
    // Simulate pressing the Save button (find it by its title "Save")
    fireEvent.press(screen.getByText("Save"));

    // Wait for onSave to have been called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it("updates customizations when GeneralInfoSection triggers onAttributeChange", async () => {
    renderPlantForm(true);

    fireEvent.press(screen.getByTestId("attribute-button"));

    fireEvent.press(screen.getByText("Save"));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_attributes: { id: mockPlant.id, name: "NewName" },
        }),
        expect.objectContaining({
          ...mockPlant,
          name: "NewName",
        }
        )
      );
    });
  });

  it("updates userData when UserDataSection triggers onUserDataChange", async () => {
    renderPlantForm(true);

    // Simulate pressing the button in UserDataSection
    fireEvent.press(screen.getByTestId("user-data-button"));

    // Check if the userData state is updated
    fireEvent.press(screen.getByText("Save"));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          customField: "NewValue",
        }),
        expect.any(Object)
      );
    });
  });
});
