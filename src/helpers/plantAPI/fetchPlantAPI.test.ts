/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/no-commented-out-tests */
import { fetchPerenualPlants } from "./fetchPlantAPI";
import { mapPerenualPlantToIPlant } from "./mapPerenualPlantToIPlant";

jest.mock("./mapOpenFarmPlantToIPlant", () => ({
  mapOpenFarmPlantToIPlant: jest.fn((plant: any) => ({
    id: plant.id.toString(),
    name: plant.name,
    contributedBy: "OpenFarm API",
  })),
}));

jest.mock("./mapPerenualPlantToIPlant", () => ({
  __esModule: true,
  mapPerenualPlantToIPlant: jest.fn((plant: any) => ({
    id: plant.id.toString(),
    contributedBy: "Perenual API",
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// describe("fetchOpenFarmPlants", () => {
//   it("should return an array of IPlant when API returns valid data", async () => {
//     const searchQuery = "banana";
//     const fakeData = {
//       data: [
//         { id: 1, name: "Banana" },
//         { id: 2, name: "Plantain" },
//       ],
//     };

//     global.fetch = jest.fn().mockResolvedValue({
//       json: jest.fn().mockResolvedValue(fakeData),
//     } as any);

//     const plants = await fetchOpenFarmPlants(searchQuery);

//     expect(global.fetch).toHaveBeenCalledWith(
//       `https://openfarm.cc/api/v1/crops/?filter=${searchQuery}`
//     );
//     expect(plants).toEqual([
//       expect.objectContaining({
//         id: "1",
//         contributedBy: "OpenFarm API",
//       }),
//       expect.objectContaining({
//         id: "2",
//         contributedBy: "OpenFarm API",
//       }),
//     ]);
//     expect(mapOpenFarmPlantToIPlant).toHaveBeenCalledTimes(
//       fakeData.data.length
//     );
//   });

//   it("should throw an error when API returns invalid data", async () => {
//     const searchQuery = "banana";
//     const fakeData = {
//       data: "invalid data",
//     };

//     global.fetch = jest.fn().mockResolvedValue({
//       json: jest.fn().mockResolvedValue(fakeData),
//     } as any);

//     await expect(fetchOpenFarmPlants(searchQuery)).rejects.toThrow(
//       "No plants found"
//     );
//   });
// });

describe("fetchPerenualPlants", () => {
  it("should return an array of IPlant when API returns valid data", async () => {
    const searchQuery = "banana";
    const fakeData = {
      data: [
        { id: 1, name: "Banana" },
        { id: 2, name: "Plantain" },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(fakeData),
      ok: true,
    } as any);

    const plants = await fetchPerenualPlants(searchQuery);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://perenual.com/api/species-list?key=API_KEY&q=${searchQuery}`
    );
    expect(plants).toEqual([
      expect.objectContaining({
        id: "1",
        contributedBy: "Perenual API",
      }),
      expect.objectContaining({
        id: "2",
        contributedBy: "Perenual API",
      }),
    ]);
    expect(mapPerenualPlantToIPlant).toHaveBeenCalledTimes(
      fakeData.data.length
    );
  });

  it("should throw an error when API returns invalid data", async () => {
    console.error = jest.fn();
    const searchQuery = "banana";
    const fakeData = {
      data: "invalid data",
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(fakeData),
    } as any);

    await expect(fetchPerenualPlants(searchQuery)).rejects.toThrow(
      "API request failed with status undefined"
    );
  });

  it("should throw an error when API returns valid response but invalid data structure", async () => {
    console.error = jest.fn();
    const searchQuery = "banana";
    const fakeData = {
      data: "invalid data",
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(fakeData),
    } as any);

    await expect(fetchPerenualPlants(searchQuery)).rejects.toThrow(
      "No plants found in API response"
    );
  });
});
