/**
 * Central API Cache System
 * Prevents multiple API calls by caching results and deduplicating in-flight requests
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

// Cache storage
const cache = new Map<string, CacheEntry<any>>()
const pendingRequests = new Map<string, PendingRequest<any>>()

// Default cache TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000

// Clean up expired entries periodically
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return
  
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

/**
 * Get cached data or fetch and cache
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  startCleanup()
  
  const now = Date.now()
  
  // Check if we have valid cached data
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) {
    console.log(`📦 Cache hit for: ${key}`)
    return cached.data
  }
  
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key)
  if (pending) {
    console.log(`⏳ Reusing pending request for: ${key}`)
    return pending.promise
  }
  
  // Create new request
  console.log(`🔄 Fetching fresh data for: ${key}`)
  const promise = fetcher()
    .then((data) => {
      // Cache the result
      cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl,
      })
      return data
    })
    .finally(() => {
      // Remove from pending requests
      pendingRequests.delete(key)
    })
  
  // Store as pending request
  pendingRequests.set(key, { promise, timestamp: now })
  
  return promise
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string) {
  cache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  cache.clear()
  pendingRequests.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    entries: cache.size,
    pendingRequests: pendingRequests.size,
  }
}

/**
 * Cached YouTube search API call
 */
export async function cachedYouTubeSearch(query: string, pageToken?: string): Promise<any> {
  const cacheKey = `youtube-search:${query}:${pageToken || ''}`
  
  return getCachedData(
    cacheKey,
    async () => {
      const url = `/api/youtube/search?q=${encodeURIComponent(query)}${pageToken ? `&pageToken=${pageToken}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok || data.quotaExceeded) {
        // Don't cache errors
        throw new Error(data.message || 'Search failed')
      }
      
      return data
    },
    5 * 60 * 1000 // 5 minutes TTL for search results
  )
}

/**
 * Batch fetch multiple queries efficiently (for recommendations)
 * Only makes unique API calls
 */
export async function batchYouTubeSearch(queries: string[]): Promise<Map<string, any>> {
  const results = new Map<string, any>()
  const uniqueQueries = [...new Set(queries)]
  
  // Process sequentially to avoid rate limiting, but use cache
  for (const query of uniqueQueries) {
    try {
      const data = await cachedYouTubeSearch(query)
      results.set(query, data)
    } catch (error) {
      console.warn(`Failed to fetch "${query}":`, error)
      results.set(query, { results: [], error: true })
    }
  }
  
  return results
}
