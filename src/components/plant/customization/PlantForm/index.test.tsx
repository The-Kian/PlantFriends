/* eslint-disable @typescript-eslint/no-var-requires */

import uuid from "react-native-uuid";

import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { IPlant, IUserPlant } from "@/constants/IPlant";
import { AuthContext } from "@/context/auth/AuthProvider";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant, mockPlant2, mockUserPlant } from "@/test-utils/MockPlant";

import PlantForm from "./";

jest.mock("@/components/plant/customization/plantCustomization.styles", () => ({
  useCustomizationStyles: () => ({
    content: { padding: 10 },
    title: { fontSize: 20 },
    buttonContainer: { marginTop: 10 },
    button: { backgroundColor: "blue" },
  }),
}));

jest.mock("./GeneralInfoSection", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Button } = require("react-native");
  const MockGeneralInfoSection = ({ onAttributeChange }: { onAttributeChange: (key: string, value: IPlant[keyof IPlant]) => void }) => (
    <Button
      testID="attribute-button"
      title="Change Attribute"
      onPress={() => onAttributeChange("name", "NewName")}
    />
  );
  MockGeneralInfoSection.displayName = "MockGeneralInfoSection";
  return MockGeneralInfoSection;
});

jest.mock("./UserDataSection", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Button } = require("react-native");
  const MockUserDataSection = ({ onUserDataChange }: { onUserDataChange: (key: string, value: IUserPlant[keyof IUserPlant]) => void })  => (
    <Button
      testID="user-data-button"
      title="Change User Data"
      onPress={() => onUserDataChange("customField", "NewValue")}
    />
  );
  MockUserDataSection.displayName = "MockUserDataSection";
  return MockUserDataSection;
});

describe("PlantForm", () => {
  const mockOnSave = jest.fn();

  const renderAddNewPlantForm = (
    displayUserPlantData: boolean = true,
    initialPlantData = mockPlant,
    initialUserPlantData = mockUserPlant,
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
      </AuthContext.Provider>,
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
    fireEvent.press(screen.getByText("Save"));

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
        expect.objectContaining({
          custom_attributes: {}, 
          id: "test-uuid", 
          plantId: "test-uuid", 
          userId: "user1", 
        }),
        
        expect.objectContaining({
          id: "test-uuid", 
          name: "NewName",
        }),
      );
    });
  });
  it("generates a new UUID when customizations.id is undefined", async () => {
    (uuid.v4 as jest.Mock).mockClear();
    const plantWithoutId = {
      ...mockPlant2,
      id: undefined,
    } as unknown as IPlant;

    renderAddNewPlantForm(true, plantWithoutId, mockUserPlant);

    fireEvent.press(screen.getByText("Save"));

    expect(uuid.v4).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_attributes: {}, 
          id: "test-uuid",
          plantId: "test-uuid", 
          userId: "user1", 
        }),
        expect.objectContaining({
          id: "test-uuid",
        }),
      );
    });
  });

  it("updates userData when UserDataSection triggers onUserDataChange", async () => {
    renderAddNewPlantForm(true);

    fireEvent.press(screen.getByTestId("user-data-button"));

    fireEvent.press(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          customField: "NewValue",
        }),
        expect.any(Object), // We don't care about plantData in this test
      );
    });
  });
});
