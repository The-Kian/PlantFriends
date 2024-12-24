import { IPlant } from "@constants/IPlant";
import { fireEvent, render, screen } from "@testing-library/react-native";

import SearchResultComponent from "./SearchResult";

describe("Search Result Button", () => {
  const mockPlant: IPlant = {
    id: "1",
    name: "Test Plant",
  };

  const onSelect = jest.fn()

  it("renders a search result", () => {
    render(<SearchResultComponent onSelect={onSelect} plant={mockPlant}/>)
    expect(screen.getByText("Test Plant")).toBeOnTheScreen()
  });

  it("calls onSelect when pressed", () => {
    render(<SearchResultComponent onSelect={onSelect} plant={mockPlant}/>)
    fireEvent.press(screen.getByText("Test Plant"))
    expect(onSelect).toHaveBeenCalled()
  })
});
