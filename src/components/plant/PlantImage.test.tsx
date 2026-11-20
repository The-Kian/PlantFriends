import React from "react";

import { Image } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";

import { PlantImage } from "./PlantImage";

describe("PlantImage", () => {
  it("shows the photo", () => {
    render(<PlantImage uri="https://x.test/a.jpg" style={{ width: 10 }} iconSize={20} />);
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: "https://x.test/a.jpg" });
    expect(screen.queryByTestId("plant-image-placeholder")).toBeNull();
  });

  it("shows the leaf when there is no photo", () => {
    render(<PlantImage uri={null} style={{ width: 10 }} iconSize={20} />);
    expect(screen.getByTestId("plant-image-placeholder")).toBeTruthy();
  });

  it("falls back to the leaf when the photo won't load, and tries a new one", () => {
    const { rerender } = render(
      <PlantImage uri="https://x.test/dead.jpg" style={{ width: 10 }} iconSize={20} />,
    );
    fireEvent(screen.UNSAFE_getByType(Image), "error");
    expect(screen.getByTestId("plant-image-placeholder")).toBeTruthy();

    rerender(<PlantImage uri="https://x.test/ok.jpg" style={{ width: 10 }} iconSize={20} />);
    expect(screen.queryByTestId("plant-image-placeholder")).toBeNull();
  });
});
