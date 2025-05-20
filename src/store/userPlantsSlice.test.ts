import { IUserPlant } from "@constants/IPlant";
import userPlantsReducer, {
  setUserPlants,
  addPlant,
  updatePlant,
  deletePlant,
} from "./userPlantsSlice";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockUserPlant, mockUserPlant2 } from "@test-utils/MockPlant";

describe("userPlantsSlice", () => {
  const initialState: IUserPlant[] = [];

  it("should handle setUserPlants", () => {
    const plants: IUserPlant[] = [mockUserPlant, mockUserPlant2];
    const newState = userPlantsReducer(initialState, setUserPlants(plants));
    expect(newState).toEqual(plants);
  });

  it("should handle addPlant", () => {
    const plant: IUserPlant = mockUserPlant;
    const newState = userPlantsReducer(initialState, addPlant(plant));
    expect(newState).toEqual([plant]);
  });

  it("should handle updatePlant", () => {
    const initialState: IUserPlant[] = [mockUserPlant, mockUserPlant2];
    const updatedPlant: IUserPlant = {
      ...mockUserPlant,
      custom_name: "Updated Plant 1",
    };
    const newState = userPlantsReducer(initialState, updatePlant(updatedPlant));
    expect(newState).toEqual([
      { ...mockUserPlant, custom_name: "Updated Plant 1" },
      mockUserPlant2,
    ]);
  });

  it("should handle deletePlant", () => {
    const initialState: IUserPlant[] = [mockUserPlant, mockUserPlant2];
    const newState = userPlantsReducer(initialState, deletePlant("1"));
    expect(newState).toEqual([mockUserPlant2]);
  });
});
