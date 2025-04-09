
import React from "react";

import { render, fireEvent, screen } from "@testing-library/react-native";

import UserDataSection from "@components/plant/customization/PlantForm/UserDataSection";



const mockUserData = {
    custom_name: "Test Plant",
    id: "123",
    userId: "456",
    plantId: "789",
};

const mockOnUserDataChange = jest.fn();

const renderComponent = (userData = mockUserData) => {
  return render(
    <UserDataSection
      userData={userData}
      onUserDataChange={mockOnUserDataChange}
    />
  );
};

describe("GeneralInfoSection", () => {
  beforeEach(() => {
    mockOnUserDataChange.mockClear();
  });

  it("renders correctly with text, number, and picker fields", () => {
    renderComponent();
    expect(screen.getByLabelText(`Custom Name input field`)).toBeVisible();
    expect(screen.getByLabelText(`Date Added input field`)).toBeVisible();
    expect(screen.getByLabelText(`Location selection field`)).toBeVisible();
  });

  it("updates the text input and calls onChangeText when the user types", () => {
    renderComponent();

    const textField = screen.getByLabelText("Custom Name input field");
    fireEvent.changeText(textField, "New Value");

    expect(mockOnUserDataChange).toHaveBeenCalledWith("custom_name", "New Value");
  });

  it("calls onAttributeChange with correct arguments for date input", () => {
    renderComponent();

    const datePickerField = screen.getByLabelText("Date Added input field");
    const newDate = new Date(2023, 10, 1);
    fireEvent(datePickerField, "onDateChange", newDate);

    expect(mockOnUserDataChange).toHaveBeenCalledWith("date_added", newDate);
    });

  it("calls onAttributeChange with correct arguments for picker input", () => {
    renderComponent();

    const pickerField = screen.getByLabelText("Location input field");
    fireEvent(pickerField, "onValueChange", "Kitchen");
    expect(mockOnUserDataChange).toHaveBeenCalledWith(
      "houseLocation",
      "Kitchen"
    );
  });
});
