import { mapPerenualPlantToIPlant } from "./mapPerenualPlantToIPlant";



describe("mapPerenualPlantToIPlant", () => {
  const minimalPlantInput = {
    id: 123,
    common_name: "Plant",
    scientific_name: ["Plant"],
    other_name: ["Plant"],
    slug: "plant",
    description: "A plant",
    sunlight: "Full sun",
    watering: 1,
    temperature_min: 1,
    temperature_max: 1,
    default_image: {
      original_url: "https://example.com/original.jpg",
      regular_url: "https://example.com/regular.jpg",
      medium_url: "https://example.com/medium.jpg",
      small_url: "https://example.com/small.jpg",
      thumbnail: "https://example.com/thumbnail.jpg",
    },
  };

  it("maps minimal plant data with defaults", () => {
    const result = mapPerenualPlantToIPlant(minimalPlantInput);
    expect(result.id).toBe("123");
    expect(result.name).toBe("Plant");
    expect(result.scientific_name).toEqual(["Plant"]);
    expect(result.common_names).toEqual(["Plant"]);
  });

  it("maps plant with default_image urls", () => {
    const plantInput = {
      ...minimalPlantInput,
      common_name: "Rose",
      default_image: {
        ...minimalPlantInput.default_image,
        original_url: "https://example.com/original.jpg",
        regular_url: "https://example.com/regular.jpg",
      },
    };
    const result = mapPerenualPlantToIPlant(plantInput);
    expect(result.id).toBe("123");
    expect(result.name).toBe("Rose");
    expect(result.images).toEqual([
      "https://example.com/original.jpg",
      "https://example.com/regular.jpg",
      "https://example.com/medium.jpg",
      "https://example.com/small.jpg",
      "https://example.com/thumbnail.jpg",
    ]);
  });

  it("maps plant with additional images", () => {
    const plantInput = {
      ...minimalPlantInput,
      id: 2,
      common_name: "Tulip",
      images: [
        { url: "https://example.com/tulip1.jpg" },
        { url: "https://example.com/tulip2.jpg" },
      ],
    };
    const result = mapPerenualPlantToIPlant(plantInput);
    expect(result.id).toBe("2");
    expect(result.name).toBe("Tulip");
    expect(result.images).toEqual([
      "https://example.com/original.jpg",
      "https://example.com/regular.jpg",
      "https://example.com/medium.jpg",
      "https://example.com/small.jpg",
      "https://example.com/thumbnail.jpg",
      "https://example.com/tulip1.jpg",
      "https://example.com/tulip2.jpg",
    ]);
  });

  it("ignores images that are empty or undefined", () => {
    const plantInput = {
      ...minimalPlantInput,
      id: 3,
      common_name: "Lily",
      default_image: {
        original_url: "",
        regular_url: undefined,
        medium_url: "https://example.com/lily_medium.jpg",
      },
      images: [{ url: "" }, { url: "" }],
    };
    const result = mapPerenualPlantToIPlant(plantInput);
    expect(result.images).toEqual(["https://example.com/lily_medium.jpg"]);
  });

  it("handles sun_requirements field that includes forbidden text", () => {
    const plantInput = {
      ...minimalPlantInput,
      id: 4,
      common_name: "Daisy",
      sunlight: "Full sun and Upgrade Plans To Premium additional info",
    };
    const result = mapPerenualPlantToIPlant(plantInput);  
    expect(result.sun_requirements).toBe("");
  });

  it("handles sun_requirements field that is valid", () => {
    const plantInput = {
      ...minimalPlantInput,
      id: 5,
      common_name: "Orchid",
      sunlight: "Partial shade",
    };
    const result = mapPerenualPlantToIPlant(plantInput);
    expect(result.sun_requirements).toBe("Partial shade");
  });

  it("uses scientific_name as name if common_name is not provided", () => {
    const plantInput = {
      ...minimalPlantInput,
      id: 6,
      common_name: "",
      scientific_name: ["Ficus lyrata", "Ficus elastica"],
    };
    const result = mapPerenualPlantToIPlant(plantInput);
    expect(result.name).toBe("Ficus lyrata");
  });
});
