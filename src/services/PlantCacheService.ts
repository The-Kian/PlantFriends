import AsyncStorage from "@react-native-async-storage/async-storage";

import { IPlant } from "@/constants/IPlant";

/**
 * PlantCacheService - Manages caching of plant search results
 * Uses a two-tier approach:
 * 1. In-memory cache for current session (fast)
 * 2. AsyncStorage for persistence across sessions
 *
 * Benefits:
 * - Reduces API calls and stays within rate limits
 * - Faster search results for repeated queries
 * - Works offline with cached data
 */

class PlantCacheService {
  // In-memory cache: Map<query, { plants: IPlant[], timestamp: number }>
  private memoryCache = new Map<string, { plants: IPlant[]; timestamp: number }>();

  // Cache expiry time: 24 hours (in milliseconds)
  private CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

  // AsyncStorage key prefix
  private STORAGE_KEY_PREFIX = "@plantfriends_cache_";

  /**
   * Get cached plants for a search query
   * Checks in-memory first, then AsyncStorage
   */
  async getSearchResults(query: string): Promise<IPlant[] | null> {
    const normalizedQuery = this.normalizeQuery(query);

    // Check in-memory cache first
    const cached = this.memoryCache.get(normalizedQuery);
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.plants;
    }

    // Check AsyncStorage
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${normalizedQuery}`;
      const storedData = await AsyncStorage.getItem(storageKey);

      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (!this.isExpired(parsed.timestamp)) {
          // Restore to in-memory cache
          this.memoryCache.set(normalizedQuery, {
            plants: parsed.plants,
            timestamp: parsed.timestamp,
          });
          return parsed.plants;
        } else {
          // Expired, remove it
          await AsyncStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.warn("Error reading plant cache from AsyncStorage:", err);
    }

    return null;
  }

  /**
   * Cache search results
   * Stores in both in-memory and AsyncStorage
   */
  async cacheSearchResults(query: string, plants: IPlant[]): Promise<void> {
    const normalizedQuery = this.normalizeQuery(query);
    const timestamp = Date.now();
    const cacheData = { plants, timestamp };

    // Store in memory
    this.memoryCache.set(normalizedQuery, cacheData);

    // Store in AsyncStorage for persistence
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${normalizedQuery}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(cacheData));
    } catch (err) {
      console.warn("Error caching plants to AsyncStorage:", err);
      // Continue - in-memory cache is still available
    }
  }

  /**
   * Clear all cached search results
   */
  async clearCache(): Promise<void> {
    // Clear in-memory cache
    this.memoryCache.clear();

    // Clear AsyncStorage cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys && Array.isArray(keys)) {
        const cacheKeys = keys.filter((k) => k.startsWith(this.STORAGE_KEY_PREFIX));
        if (cacheKeys.length > 0) {
          await Promise.all(cacheKeys.map((key) => AsyncStorage.removeItem(key)));
        }
      }
    } catch (err) {
      console.warn("Error clearing plant cache from AsyncStorage:", err);
    }
  }

  /**
   * Clear cache for a specific query
   */
  async clearQueryCache(query: string): Promise<void> {
    const normalizedQuery = this.normalizeQuery(query);

    // Clear from memory
    this.memoryCache.delete(normalizedQuery);

    // Clear from AsyncStorage
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${normalizedQuery}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (err) {
      console.warn("Error clearing query cache from AsyncStorage:", err);
    }
  }

  /**
   * Get cache statistics (in-memory only)
   */
  getCacheStats(): { entries: number; queries: string[] } {
    return {
      entries: this.memoryCache.size,
      queries: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Normalize query for consistent caching
   * Lowercases and trims whitespace
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  /**
   * Check if cached data has expired
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_EXPIRY_MS;
  }
}

// Export singleton instance
export default new PlantCacheService();
