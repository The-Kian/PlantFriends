/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";
import uuid from "react-native-uuid";

import { AuthContext } from "@context/auth/AuthProvider";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant, mockPlant2, mockUserPlant } from "@test-utils/MockPlant";`  `
import PlantForm from "./";
import { IPlant } from "@constants/IPlant";



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
  const MockGeneralInfoSection = ({ onAttributeChange }: any) => (
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
  const MockUserDataSection = ({ onUserDataChange }: any) => (
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
  it("generates a new UUID when customizations.id is undefined", async () => {
    // Reset the mock counter
    (uuid.v4 as jest.Mock).mockClear();
    
    // Create a plant data without ID - use type assertion to avoid TS error
    const plantWithoutId = { ...mockPlant2, id: undefined } as unknown as IPlant;
    
    renderPlantForm(true, plantWithoutId, mockUserPlant);
    
    // Save the form
    fireEvent.press(screen.getByText("Save"));
    
    await waitFor(() => {
      // Verify uuid.v4 was called to generate the missing ID
      expect(uuid.v4).toHaveBeenCalled();
      
      // Verify the generated ID ("test-uuid") was used for the plant
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          plantId: "test-uuid",
        }),
        expect.objectContaining({
          id: "test-uuid",
        })
      );
    });
  });

  it("updates userData when UserDataSection triggers onUserDataChange", async () => {
    renderPlantForm(true);
    
    // Trigger the user data change by clicking the mock button
    fireEvent.press(screen.getByTestId("user-data-button"));
    
    // Save the form to see the changes reflected in the onSave call
    fireEvent.press(screen.getByText("Save"));
    
    await waitFor(() => {
      // Verify the userData contains the updated field value
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          // The mock UserDataSection calls onUserDataChange with 
          // field: "customField", value: "NewValue"
          customField: "NewValue"
        }),
        expect.any(Object)
      );
    });
  });
});
