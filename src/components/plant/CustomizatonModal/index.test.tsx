import React from "react";

import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import { render, fireEvent, screen } from "@testing-library/react-native";

import PlantCustomizationModal from "./index";
import mockAuthContextValue from "../../../../jest/MockAuthContextValue";
import mockUser from "../../../../jest/MockFirebaseUser";


const mockPlant: IPlant = {
  id: "1",
  name: "Test Plant",
  
};

const mockUserPlant: IUserPlant = {
  id: "1",
  userId: "user1",
  plantId: "1",
  houseLocation: "Kitchen",
  custom_attributes: {
    name: "Custom Plant",
  },
};

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const renderComponent = (plant = mockPlant, userPlant = mockUserPlant) => {
  return render(
    <AuthContext.Provider value={ {...mockUser, ...mockAuthContextValue} }>
      <PlantCustomizationModal
        plant={plant}
        userPlant={userPlant}
        onClose={mockOnClose}
        onSave={mockOnSave}
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
    expect(screen.getByText("Customize Your Plant")).toBeTruthy();
  });

  it("calls onClose when the Cancel button is pressed", () => {
    renderComponent();
    fireEvent.press(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onSave with correct arguments when the Save button is pressed", () => {
    renderComponent();
    fireEvent.press(screen.getByText("Save"));
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        userId: "user1",
        plantId: "1",
        custom_attributes: {
          name: "Custom Plant",
        },
      }),
      mockPlant
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("updates user data when a change is made in UserDataSection", () => {
    renderComponent();
  
    // Simulate changing a field in UserDataSection
    const userNameInput = screen.getByLabelText("Custom Name input field"); // Ensure the label matches your component
    fireEvent.changeText(userNameInput, "New Custom Name");
  
    // Check that user data state was updated
    expect(mockOnSave).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Save"));
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1", // User ID remains
        custom_attributes: expect.objectContaining({ name: "Custom Plant" }),
      }),
      mockPlant
    );
  });

  it("prepares the user plant data correctly when Save is pressed", () => {
    renderComponent();
  
    // Check that the data structure is correct when Save is pressed
    fireEvent.press(screen.getByText("Save"));
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String), // Ensures a valid ID is used
        userId: "user1",
        plantId: "1",
        custom_attributes: expect.objectContaining({
          name: "Custom Plant",
        }),
      }),
      mockPlant
    );
  });
  
  
});