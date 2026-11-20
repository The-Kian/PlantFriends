import { mapTreflePlantToIPlant, TreflePlant } from "./mapTreflePlantToIPlant";

const trefle = (fields: Partial<TreflePlant> = {}): TreflePlant =>
  ({
    id: 1,
    common_name: "Fruit-salad-plant",
    scientific_name: "Monstera deliciosa",
    slug: "monstera-deliciosa",
    genus: "Monstera",
    family: "Araceae",
    family_common_name: null,
    image_url: null,
    bibliography: null,
    author: null,
    status: "accepted",
    rank: "species",
    year: 1849,
    synonyms: [],
    ...fields,
  }) as TreflePlant;

describe("mapTreflePlantToIPlant", () => {
  it("describes a plant with nothing else to say by its family", () => {
    expect(mapTreflePlantToIPlant(trefle()).description).toBe(
      "A plant in the Araceae family"
    );
  });

  it("doesn't invent a family", () => {
    expect(
      mapTreflePlantToIPlant(trefle({ family: undefined as never })).description
    ).toBe("A plant");
  });
});
