const { mapTreflePlantToIPlant } = require("./treflePlant");

describe("mapTreflePlantToIPlant", () => {
  const base = { id: 1, common_name: "Golden pothos", scientific_name: "Epipremnum aureum" };

  it("describes a plant with no other details by its family", () => {
    expect(mapTreflePlantToIPlant({ ...base, family: "Araceae" }).description).toBe(
      "A plant in the Araceae family",
    );
  });

  it("never says 'undefined' when the family is missing", () => {
    expect(mapTreflePlantToIPlant(base).description).toBe("A plant");
  });

  it("prefers the details Trefle has", () => {
    const plant = mapTreflePlantToIPlant({ ...base, family: "Araceae", growth_habit: "Vine" });
    expect(plant.description).toBe("Growth: Vine");
  });
});
