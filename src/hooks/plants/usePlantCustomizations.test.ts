import { renderHook, act } from "@testing-library/react-native";

import usePlantCustomizations from "./usePlantCustomizations";

describe("usePlantCustomizations", () => {
  it("should initialize with empty customizations", () => {
    const { result } = renderHook(() => usePlantCustomizations());
    expect(result.current.customizations).toEqual({});
  });

  it("should update customizations when handlePlantAttributeChange is called", () => {
    const { result } = renderHook(() => usePlantCustomizations());

    act(() => {
      result.current.handlePlantAttributeChange("name", "My Custom Plant");
    });

    expect(result.current.customizations).toEqual({
      name: "My Custom Plant",
    });
  });

  it("should merge multiple attribute changes", () => {
    const { result } = renderHook(() => usePlantCustomizations());

    act(() => {
      result.current.handlePlantAttributeChange("name", "Monstera");
      result.current.handlePlantAttributeChange("description", "A green plant");
    });

    expect(result.current.customizations).toEqual({
      name: "Monstera",
      description: "A green plant",
    });
  });

  it("should overwrite previous value when same field is updated", () => {
    const { result } = renderHook(() => usePlantCustomizations());

    act(() => {
      result.current.handlePlantAttributeChange("name", "Old Name");
    });

    expect(result.current.customizations).toEqual({ name: "Old Name" });

    act(() => {
      result.current.handlePlantAttributeChange("name", "New Name");
    });

    expect(result.current.customizations).toEqual({ name: "New Name" });
  });
});
