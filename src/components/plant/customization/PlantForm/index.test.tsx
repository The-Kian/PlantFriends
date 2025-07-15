/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */

import uuid from "react-native-uuid";

import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { IPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant, mockPlant2, mockUserPlant } from "@test-utils/MockPlant";

import PlantForm from "./";

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
  const renderAddNewPlantForm = (
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
          isAddingNewPlant={true}
        />
      </AuthContext.Provider>
    );
  };

  it('renders correctly with title "Add New Plant', () => {
    renderAddNewPlantForm();
    expect(screen.getByText("Add New Plant")).toBeTruthy();
  });

  it("renders UserDataSection when displayUserPlantData is true", () => {
    renderAddNewPlantForm(true);
    expect(screen.getByText("Change User Data")).toBeTruthy();
  });

  it("does not render UserDataSection when displayUserPlantData is false", () => {
    renderAddNewPlantForm(false);
    expect(screen.queryByText("Change User Data")).toBeNull();
  });

  it("calls onSave with proper data when the Save button is pressed", async () => {
    renderAddNewPlantForm();
    // Simulate pressing the Save button (find it by its title "Save")
    fireEvent.press(screen.getByText("Save"));

    // Wait for onSave to have been called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it("updates customizations when GeneralInfoSection triggers onAttributeChange", async () => {
    renderAddNewPlantForm(true);

    fireEvent.press(screen.getByTestId("attribute-button"));

    fireEvent.press(screen.getByText("Save"));
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        // Expect userPlantData to not have plant attributes in custom_attributes
        expect.objectContaining({
          custom_attributes: {}, // Or other expected user customizations
          id: "test-uuid", // Expect the generated UUID for user data
          plantId: "test-uuid", // Expect the plantId to be linked to the plant\'s new ID
          userId: "user1", // Expect the correct userId
        }),
        // Expect plantData to have the updated name and its ID
        expect.objectContaining({
          id: "test-uuid", // Expect the generated UUID for the plant
          name: "NewName",
        })
      );
    });
  });
  it("generates a new UUID when customizations.id is undefined", async () => {
    // Reset the mock counter
    (uuid.v4 as jest.Mock).mockClear();

    // Create a plant data without ID - use type assertion to avoid TS error
    const plantWithoutId = { ...mockPlant2, id: undefined } as unknown as IPlant;

    renderAddNewPlantForm(true, plantWithoutId, mockUserPlant);

    // Save the form
    fireEvent.press(screen.getByText("Save"));

    // Verify uuid.v4 was called to generate the missing ID
    expect(uuid.v4).toHaveBeenCalled();
    await waitFor(() => {

      // Verify the generated ID ("test-uuid") was used for the plant
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_attributes: {}, // Add expectation for custom_attributes
          id: "test-uuid", // Expect the generated UUID for user data
          plantId: "test-uuid", // Expect the plantId to be linked to the plant\'s new ID
          userId: "user1", // Expect the correct userId
        }),
        expect.objectContaining({
          id: "test-uuid",
        })
      );
    });
  });


  it("updates userData when UserDataSection triggers onUserDataChange", async () => {
    renderAddNewPlantForm(true);

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
