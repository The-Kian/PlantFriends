import React from "react";

import { StyleSheet } from "react-native";

import { screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import SwitchField from "./SwitchField";

describe("SwitchField", () => {
  const opacityOf = (label: string) =>
    StyleSheet.flatten(screen.getByTestId(`switch-field-${label}`).props.style)
      .opacity;

  it("fades the row when disabled, so it looks greyed out", () => {
    renderWithProviders(
      <SwitchField label="Reminders" value onValueChange={jest.fn()} disabled />
    );
    expect(opacityOf("Reminders")).toBeLessThan(1);
    expect(screen.getByLabelText("Reminders")).toBeDisabled();
  });

  it("is fully visible when enabled", () => {
    renderWithProviders(
      <SwitchField label="Reminders" value onValueChange={jest.fn()} />
    );
    expect(opacityOf("Reminders") ?? 1).toBe(1);
  });
});
