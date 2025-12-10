// Cache Manager for Years Tab data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CACHE_PREFIX = "medjust_cache_";
const CACHE_VERSION = 1;
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour in milliseconds

export interface YearsCacheData {
  years: any[];
  batches: any[];
  subjects: any[];
  lastFetched: number;
}

class CacheManager {
  private static instance: CacheManager;
  private ttl: number;

  private constructor(ttl: number = DEFAULT_TTL) {
    this.ttl = ttl;
  }

  static getInstance(ttl?: number): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(ttl);
    }
    return CacheManager.instance;
  }

  /**
   * Get cache key for a specific cache type
   */
  private getCacheKey(type: string): string {
    return `${CACHE_PREFIX}${type}`;
  }

  /**
   * Check if cache is available and not expired
   */
  isCacheValid(type: string): boolean {
    try {
      const key = this.getCacheKey(type);
      const cached = localStorage.getItem(key);

      if (!cached) {
        console.log(`📦 No cache found for ${type}`);
        return false;
      }

      const entry: CacheEntry<any> = JSON.parse(cached);

      // Check version compatibility
      if (entry.version !== CACHE_VERSION) {
        console.log(`📦 Cache version mismatch for ${type}, invalidating`);
        this.clearCache(type);
        return false;
      }

      // Check if cache has expired
      const isExpired = Date.now() - entry.timestamp > this.ttl;
      if (isExpired) {
        console.log(`📦 Cache expired for ${type}`);
        this.clearCache(type);
        return false;
      }

      const cacheAge = Date.now() - entry.timestamp;
      const cacheAgeMinutes = Math.round(cacheAge / 1000 / 60);
      console.log(
        `✅ Valid cache found for ${type} (${cacheAgeMinutes} minutes old)`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Error checking cache for ${type}:`, error);
      return false;
    }
  }

  /**
   * Get cached data
   */
  getCache<T>(type: string): T | null {
    try {
      const key = this.getCacheKey(type);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      console.log(`📦 Retrieved cache for ${type}`);
      return entry.data;
    } catch (error) {
      console.error(`❌ Error retrieving cache for ${type}:`, error);
      return null;
    }
  }

  /**
   * Set cache data
   */
  setCache<T>(type: string, data: T): void {
    try {
      const key = this.getCacheKey(type);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`💾 Cached ${type}`);
    } catch (error) {
      console.error(`❌ Error setting cache for ${type}:`, error);
    }
  }

  /**
   * Clear cache for a specific type
   */
  clearCache(type: string): void {
    try {
      const key = this.getCacheKey(type);
      localStorage.removeItem(key);
      console.log(`🗑️  Cleared cache for ${type}`);
    } catch (error) {
      console.error(`❌ Error clearing cache for ${type}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(CACHE_PREFIX),
      );

      keys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`🗑️  Cleared all cache (${keys.length} entries)`);
    } catch (error) {
      console.error("❌ Error clearing all cache:", error);
    }
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): {
    totalSize: number;
    entries: Array<{ type: string; size: number; age: number }>;
  } {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(CACHE_PREFIX),
      );

      let totalSize = 0;
      const entries = keys.map((key) => {
        const cached = localStorage.getItem(key);
        const size = cached ? cached.length : 0;
        totalSize += size;

        const typeMatch = key.match(new RegExp(`^${CACHE_PREFIX}(.+)$`));
        const type = typeMatch ? typeMatch[1] : "unknown";

        let age = 0;
        try {
          const entry = cached ? JSON.parse(cached) : null;
          age = entry ? Date.now() - entry.timestamp : 0;
        } catch (e) {
          age = -1;
        }

        return {
          type,
          size,
          age,
        };
      });

      return {
        totalSize,
        entries,
      };
    } catch (error) {
      console.error("❌ Error getting cache stats:", error);
      return {
        totalSize: 0,
        entries: [],
      };
    }
  }
}

export default CacheManager.getInstance();
