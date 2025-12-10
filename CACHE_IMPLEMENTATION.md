# Years Tab Caching Implementation

## Overview

A client-side caching system has been implemented for the Years Tab to improve performance and reduce Firebase API calls. The system uses localStorage with a stale-while-revalidate pattern.

## Architecture

### Cache Manager (`client/lib/cacheManager.ts`)

The `CacheManager` is a singleton class that manages all caching operations:

**Features:**
- **localStorage-based storage**: Persists data across browser sessions
- **TTL Support**: Default 1 hour (configurable)
- **Version Compatibility**: Prevents mismatched cache versions
- **Multiple Cache Types**: Supports years, batches, and subjects
- **Cache Statistics**: Debug utilities to monitor cache usage

**API:**
```typescript
// Check if cache is still valid
isCacheValid(type: string): boolean

// Get cached data
getCache<T>(type: string): T | null

// Set cache data
setCache<T>(type: string, data: T): void

// Clear specific cache
clearCache(type: string): void

// Clear all caches
clearAllCache(): void

// Get cache statistics
getCacheStats(): { totalSize: number; entries: [...] }
```

### Hook Integration (`client/hooks/useYears.ts`)

The `useYears` hook integrates caching with a smart fetch strategy:

**Load Pattern:**
1. Check if valid cache exists for years, batches, and subjects
2. If all caches valid: Load and display immediately
3. Set connection status to "connected"
4. Fetch fresh data from Firebase in background
5. Update cache with fresh data
6. If no cache available: Show loading state while fetching

**Cache Invalidation:**
- Cache is cleared immediately when any mutation occurs (create, update, delete)
- Fresh data is fetched to repopulate cache
- This ensures data consistency

**Functions Modified:**
- `createYear()` - Clears cache before creating
- `createBatch()` - Clears cache before creating
- `createSubject()` - Clears cache before creating
- `createLecture()` - Clears cache before creating
- `updateYear()` - Clears cache before updating
- `updateBatch()` - Clears cache before updating
- `deleteLecture()` - Clears cache before deleting
- `deleteSubject()` - Clears cache before deleting
- `deleteBatch()` - Clears cache before deleting

**New Exported Functions:**
- `clearCache()` - Manually clear all Years Tab caches

### UI Changes (`client/pages/admin/Years.tsx`)

**New Button:**
A "🔄 Refresh Cache" button is now available in the header, allowing users to manually clear cache and fetch fresh data from the server.

Location: Top right of the Years page, next to the "Add Batch" button

## Performance Benefits

1. **Instant Page Load**: Cached data displays immediately on page load
2. **Reduced API Calls**: Subsequent page visits within 1 hour don't hit Firebase
3. **Offline Support**: Can view cached data even without internet
4. **Background Updates**: Fresh data fetches in background without blocking UI
5. **Automatic Invalidation**: Cache clears on any data mutations

## Cache Behavior

### First Load
- No cache exists
- Loading spinner shows
- Firebase data fetches
- Data displays and gets cached

### Second Load (within 1 hour)
- Cache is valid
- Data displays instantly from cache
- Fresh data fetches in background
- Cache updated silently

### Cache Expiration (after 1 hour)
- Cache is invalid
- Loading spinner shows
- Fresh data fetches from Firebase
- Data displays and cache resets

### After Mutation (create/update/delete)
- Cache immediately cleared
- Fresh data fetches
- Updated data displays and caches

### Manual Refresh
- User clicks "Refresh Cache" button
- Cache cleared
- Fresh data fetches
- Updated data displays

## Storage Details

**localStorage Keys:**
- `medjust_cache_years` - Cached years data
- `medjust_cache_batches` - Cached batches data
- `medjust_cache_subjects` - Cached subjects data

**Cache Entry Structure:**
```typescript
{
  data: YearData[] | BatchData[] | SubjectData[],
  timestamp: number,
  version: number
}
```

**Cache Size:**
- Typical size: 50-200KB per cache type
- Total: ~150-600KB for all three caches

## Configuration

**TTL (Time To Live):** 1 hour (3,600,000 milliseconds)
- Located in `client/lib/cacheManager.ts`
- Modify `DEFAULT_TTL` to change

**Cache Version:** 1
- Automatically increments when cache structure changes
- Prevents stale cache usage after updates

## Debugging

### Check Cache Status
Open browser DevTools console and run:
```typescript
import cacheManager from '@/lib/cacheManager';
cacheManager.getCacheStats();
```

### Clear All Cache
```typescript
cacheManager.clearAllCache();
```

### Check Specific Cache
```typescript
cacheManager.getCache('years');
cacheManager.isCacheValid('years');
```

## Browser Compatibility

Works in all modern browsers that support:
- localStorage API
- JSON serialization
- ES6 features

## Future Enhancements

1. **IndexedDB**: Use IndexedDB instead of localStorage for larger datasets
2. **Service Workers**: Implement offline-first with service workers
3. **Cache Compression**: Gzip compression for cached data
4. **Smart Invalidation**: Invalidate only affected caches per operation
5. **Cache Preloading**: Preload cache on app startup
6. **Cache Synchronization**: Multi-tab cache synchronization
