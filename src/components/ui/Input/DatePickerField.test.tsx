import { render, fireEvent, screen } from "@testing-library/react-native";

import React from "react";


import DatePickerField from "./DatePickerField";

describe("DatePickerField", () => {
  const mockDate = new Date(2024, 10, 17);
  const mockOnDateChange = jest.fn();

  const renderComponent = () => {
    render(
      <DatePickerField
        label="Select Date"
        date={mockDate}
        onDateChange={mockOnDateChange}
      />
    );
  };

  it("renders correctly", () => {
    renderComponent();

    // Verify label and initial date value
    expect(screen.getByText("Select Date")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter Select Date")).toBeOnTheScreen();

    // Ensure DateTimePicker is not visible initially
    expect(screen.queryByTestId("date-picker")).toBeNull();
  });

  it("opens the DateTimePicker when pressed", () => {
    renderComponent();
    fireEvent.press(screen.getByDisplayValue(mockDate.toDateString()));
    expect(screen.getByTestId("date-picker")).toBeTruthy();
  });

  it("handles date changes correctly", () => {
    render(
      <DatePickerField
        label="Select Date"
        date={mockDate}
        onDateChange={mockOnDateChange}
      />
    );

    const newSelectedDate = new Date(2023, 12, 12);
    fireEvent.press(screen.getByDisplayValue(mockDate.toDateString()));
    const timePicker = screen.getByTestId("date-picker");
    fireEvent(timePicker, "onChange", {
      nativeEvent: {
        timestamp: newSelectedDate.getTime(),
      },
    });
    expect(mockOnDateChange).toHaveBeenCalledWith(newSelectedDate);
    render(
      <DatePickerField
        label="Select Date"
        date={newSelectedDate}
        onDateChange={mockOnDateChange}
      />
    );
    expect(screen.getByDisplayValue(newSelectedDate.toDateString())).toBeOnTheScreen();
  });

});
