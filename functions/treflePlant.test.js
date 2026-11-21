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

describe("saveToCatalogue", () => {
  const { saveToCatalogue, catalogueEntry } = require("./treflePlant");

  const fakeDb = (existing) => {
    const written = {};
    return {
      written,
      collection: () => ({ doc: (id) => ({ id }) }),
      getAll: async (...refs) => refs.map((r) => ({ exists: existing.includes(r.id) })),
      batch: () => {
        const ops = [];
        return {
          set: (ref, data) => ops.push([ref.id, data]),
          commit: async () => ops.forEach(([id, data]) => (written[id] = data)),
        };
      },
    };
  };

  it("adds only the plants the catalogue doesn't have", async () => {
    const db = fakeDb(["1"]);
    const added = await saveToCatalogue(db, [
      { id: "1", name: "Golden pothos" },
      { id: "2", name: "Snake plant", scientific_name: ["Dracaena trifasciata"], description: "" },
    ]);
    expect(added).toBe(1);
    expect(Object.keys(db.written)).toEqual(["2"]);
    expect(db.written["2"]).toEqual({
      id: "2",
      name: "Snake plant",
      slug: "snake plant",
      scientific_name: ["Dracaena trifasciata"],
      contributed_by: "Trefle",
      isVerified: false,
    });
  });

  it("does nothing for an empty search", async () => {
    expect(await saveToCatalogue(fakeDb([]), [])).toBe(0);
  });

  it("never marks a Trefle entry as verified", () => {
    expect(catalogueEntry({ id: "3", name: "Fern", isVerified: true }).isVerified).toBe(false);
  });
});
