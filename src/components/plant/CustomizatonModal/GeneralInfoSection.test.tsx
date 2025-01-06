import { render, fireEvent, screen } from "@testing-library/react-native";
import React from "react";

import { generalInfoFields } from "@components/plant/customization/PlantForm/GeneralInfoFields";
import GeneralInfoSection from "@components/plant/customization/PlantForm/GeneralInfoSection";
import { IPlant } from "@constants/IPlant";


const mockAttributes: IPlant = {
  id: "123",
  name: "Test Plant",
  temperature_maximum: 80,
  sun_requirements: "Full Sun",
};

const mockOnAttributeChange = jest.fn();

const renderComponent = (attributes = mockAttributes) => {
  return render(
    <GeneralInfoSection
      attributes={attributes}
      onAttributeChange={mockOnAttributeChange}
    />
  );
};

describe("GeneralInfoSection", () => {
  beforeEach(() => {
    mockOnAttributeChange.mockClear();
  });

  it("renders correctly with text, number, and picker fields", () => {
    renderComponent();

    generalInfoFields.forEach((fieldConfig) => {
      const label = fieldConfig.label;
      expect(screen.getByLabelText(`${label} input field`)).toBeVisible();
    });
  });

  it("updates the text input and calls onChangeText when the user types", () => {
    renderComponent();
  
    const textField = screen.getByLabelText("Name input field");
    fireEvent.changeText(textField, 'New Value');

    expect(mockOnAttributeChange).toHaveBeenCalledWith("name",'New Value');
  });

  it("calls onAttributeChange with correct arguments for number input", () => {
    renderComponent();

    const numberField = screen.getByLabelText("Maximum Temperature input field");
    fireEvent.changeText(numberField, '69');
    expect(mockOnAttributeChange).toHaveBeenCalledWith("temperature_maximum", 69);
  });

  it("calls onAttributeChange with correct arguments for picker input", () => {
    renderComponent();

    const pickerField = screen.getByLabelText("Sun Requirements input field");
    fireEvent(pickerField, "onValueChange", "Partial Sun");
    expect(mockOnAttributeChange).toHaveBeenCalledWith("sun_requirements", "Partial Sun");
  });



});
