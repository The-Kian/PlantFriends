import { fireEvent, render, screen } from "@testing-library/react-native";
import PlantSearchResults from "./index";
import { mockPlant, mockPlant2 } from "@test-utils/MockPlant";

describe("PlantSearchResults", () => {
  it("Should render more than one plant", () => {
    const plantsToRender = [mockPlant, mockPlant2];

    render(
      <PlantSearchResults plants={plantsToRender} onSelectPlant={jest.fn()} />
    );
    expect(screen.getByText(mockPlant.name!)).toBeVisible();
    expect(screen.getByText(mockPlant2.name!)).toBeVisible();
  });
  
  it("should call onSelectPlant when a plant is selected", () => {
    const onSelectPlant = jest.fn();
    render(
      <PlantSearchResults plants={[mockPlant]} onSelectPlant={onSelectPlant} />
    );
    const plant = screen.getByText(mockPlant.name!);
    fireEvent.press(plant);
    expect(onSelectPlant).toHaveBeenCalledWith(mockPlant);
  })
});
