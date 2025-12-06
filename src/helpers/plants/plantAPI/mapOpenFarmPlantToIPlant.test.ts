import { mapOpenFarmPlantToIPlant } from "./mapOpenFarmPlantToIPlant";

describe("mapOpenFarmPlantToIPlant", () => {
  it("should map a plant with minimal attributes", () => {
    const input = { id: 123, attributes: {} };
    const result = mapOpenFarmPlantToIPlant(input);

    expect(result).toEqual({
      id: "123",
      name: "",
      slug: "",
      scientific_name: [],
      common_names: [],
      description: "",
      sun_requirements: "",
      watering_frequency: 0,
      temperature_minimum: 0,
      temperature_maximum: 0,
      humidity_requirements: "",
      growth_rate: "",
      pruning_needs: "",
      pest_susceptibility: [],
      toxicity: "",
      images: [],
      mature_size: "",
      contributedBy: "OpenFarm API",
      isVerified: false,
    });
  });

  it("should map a plant with full attributes including images", () => {
    const input = {
      id: 456,
      attributes: {
        name: "Rose",
        slug: "rose",
        scientific_name: "Rosa",
        common_names: ["Rose", "Flower"],
        description: "A fragrant flower.",
        sun_requirements: "Full sun",
        watering_frequency: 3,
        temperature_minimum: 5,
        temperature_maximum: 25,
        humidity_requirements: "Low humidity",
        growth_rate: "Slow",
        pruning_needs: "Medium",
        pest_susceptibility: ["Aphids"],
        toxicity: "Non-toxic",
        images: [
          { image_url: "http://example.com/rose1.jpg" },
          { image_url: "" },
          { image_url: "http://example.com/rose2.jpg" },
        ],
        height: "Tall",
      },
    };

    const result = mapOpenFarmPlantToIPlant(input);

    expect(result).toEqual({
      id: "456",
      name: "Rose",
      slug: "rose",
      scientific_name: ["Rosa"],
      common_names: ["Rose", "Flower"],
      description: "A fragrant flower.",
      sun_requirements: "Full sun",
      watering_frequency: 3,
      temperature_minimum: 5,
      temperature_maximum: 25,
      humidity_requirements: "Low humidity",
      growth_rate: "Slow",
      pruning_needs: "Medium",
      pest_susceptibility: ["Aphids"],
      toxicity: "Non-toxic",
      images: ["http://example.com/rose1.jpg", "http://example.com/rose2.jpg"],
      mature_size: "Tall",
      contributedBy: "OpenFarm API",
      isVerified: false,
    });
  });

  it("should handle when plant.attributes is undefined", () => {
    const input = { id: 789 };
    const result = mapOpenFarmPlantToIPlant(input);

    expect(result).toEqual({
      id: "789",
      name: "",
      slug: "",
      scientific_name: [],
      common_names: [],
      description: "",
      sun_requirements: "",
      watering_frequency: 0,
      temperature_minimum: 0,
      temperature_maximum: 0,
      humidity_requirements: "",
      growth_rate: "",
      pruning_needs: "",
      pest_susceptibility: [],
      toxicity: "",
      images: [],
      mature_size: "",
      contributedBy: "OpenFarm API",
      isVerified: false,
    });
  });
});
