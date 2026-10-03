import AsyncStorage from "@react-native-async-storage/async-storage";

import PlantCacheService from "@/services/PlantCacheService";
import { mockPlant } from "@/test-utils/MockPlant";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage");

describe("PlantCacheService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe("cacheSearchResults and getSearchResults", () => {
    it("should cache and retrieve plant search results from memory", async () => {
      const query = "tomato";
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults(query, plants);
      const cached = await PlantCacheService.getSearchResults(query);

      expect(cached).toEqual(plants);
    });

    it("should normalize queries (case-insensitive)", async () => {
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults("TOMATO", plants);
      const cached = await PlantCacheService.getSearchResults("tomato");

      expect(cached).toEqual(plants);
    });

    it("should return null for uncached queries", async () => {
      const cached = await PlantCacheService.getSearchResults("nonexistent");
      expect(cached).toBeNull();
    });

    it("should store and retrieve from AsyncStorage", async () => {
      const query = "lettuce";
      const plants = [mockPlant];

      // Mock AsyncStorage.getItem to return null (not in storage)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      await PlantCacheService.cacheSearchResults(query, plants);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should handle AsyncStorage errors gracefully", async () => {
      const query = "pepper";
      const plants = [mockPlant];

      // Mock AsyncStorage to throw error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage error"),
      );

      // Should not throw
      await expect(
        PlantCacheService.cacheSearchResults(query, plants),
      ).resolves.toBeUndefined();

      // But should still be in memory
      const cached = await PlantCacheService.getSearchResults(query);
      expect(cached).toEqual(plants);
    });
  });

  describe("clearCache", () => {
    it("should clear all caches", async () => {
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults("tomato", plants);
      await PlantCacheService.clearCache();

      const cached = await PlantCacheService.getSearchResults("tomato");
      expect(cached).toBeNull();
    });

    it("should clear AsyncStorage keys", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        "@plantfriends_cache_tomato",
        "@plantfriends_cache_pepper",
      ]);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await PlantCacheService.clearCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearQueryCache", () => {
    it("should clear cache for specific query", async () => {
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults("tomato", plants);
      await PlantCacheService.cacheSearchResults("pepper", plants);

      await PlantCacheService.clearQueryCache("tomato");

      expect(await PlantCacheService.getSearchResults("tomato")).toBeNull();
      expect(await PlantCacheService.getSearchResults("pepper")).toEqual(plants);
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults("tomato", plants);
      await PlantCacheService.cacheSearchResults("pepper", plants);

      const stats = PlantCacheService.getCacheStats();

      expect(stats.entries).toBe(2);
      expect(stats.queries).toContain("tomato");
      expect(stats.queries).toContain("pepper");
    });
  });

  describe("cache expiry", () => {
    it("should return null for expired cache entries", async () => {
      const query = "expired";
      const plants = [mockPlant];

      await PlantCacheService.cacheSearchResults(query, plants);

      // Mock the time to be 25 hours later
      jest.spyOn(Date, "now").mockReturnValueOnce(Date.now() + 25 * 60 * 60 * 1000);

      const cached = await PlantCacheService.getSearchResults(query);
      expect(cached).toBeNull();
    });
  });
});
