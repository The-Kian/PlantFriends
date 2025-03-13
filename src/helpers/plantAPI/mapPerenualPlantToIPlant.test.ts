import { mapPerenualPlantToIPlant } from "./mapPerenualPlantToIPlant";

describe("mapPerenualPlantToIPlant", () => {
    it("maps minimal plant data with defaults", () => {
        const plantInput = {
            id: 123,
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.id).toBe("123");
        expect(result.name).toBe("");
        expect(result.slug).toBe("");
        expect(result.scientific_name).toEqual([]);
        expect(result.common_names).toEqual([]);
        expect(result.description).toBe("");
        expect(result.sun_requirements).toBe("");
        expect(result.watering_frequency).toBe(0);
        expect(result.fertilizer_needs).toBe("");
        expect(result.temperature_minimum).toBe(0);
        expect(result.temperature_maximum).toBe(0);
        expect(result.humidity_requirements).toBe("");
        expect(result.growth_rate).toBe("");
        expect(result.pruning_needs).toBe("");
        expect(result.pest_susceptibility).toEqual([]);
        expect(result.toxicity).toBe("");
        expect(result.images).toEqual([]);
        expect(result.mature_size).toBe("");
        expect(result.contributedBy).toBe("Perenual API");
        expect(result.isVerified).toBe(false);
    });

    it("maps plant with default_image urls", () => {
        const plantInput = {
            id: 1,
            common_name: "Rose",
            default_image: {
                original_url: "https://example.com/original.jpg",
                regular_url: "https://example.com/regular.jpg",
                medium_url: "https://example.com/medium.jpg",
                small_url: "https://example.com/small.jpg",
                thumbnail: "https://example.com/thumbnail.jpg",
            },
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.id).toBe("1");
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
            "https://example.com/tulip1.jpg",
            "https://example.com/tulip2.jpg",
        ]);
    });

    it("ignores images that are empty or undefined", () => {
        const plantInput = {
            id: 3,
            common_name: "Lily",
            default_image: {
                original_url: "",
                regular_url: undefined,
                medium_url: "https://example.com/lily_medium.jpg",
            },
            images: [{ url: null }, {}],
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.images).toEqual([
            "https://example.com/lily_medium.jpg"
        ]);
    });

    it("handles sun_requirements field that includes forbidden text", () => {
        const plantInput = {
            id: 4,
            common_name: "Daisy",
            sunlight: "Full sun and Upgrade Plans To Premium additional info",
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.sun_requirements).toBe("");
    });

    it("handles sun_requirements field that is valid", () => {
        const plantInput = {
            id: 5,
            common_name: "Orchid",
            sunlight: "Partial shade",
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.sun_requirements).toBe("Partial shade");
    });

    it("uses scientific_name as name if common_name is not provided", () => {
        const plantInput = {
            id: 6,
            scientific_name: ["Ficus lyrata", "Ficus elastica"],
        };
        const result = mapPerenualPlantToIPlant(plantInput);
        expect(result.name).toBe("Ficus lyrata");
    });
});