import YTMusic from 'ytmusic-api'

// Singleton instance for YTMusic
let ytmusicInstance: YTMusic | null = null
let isInitializing = false
let initPromise: Promise<YTMusic> | null = null

/**
 * Get or create a YTMusic instance (singleton pattern)
 * Ensures only one instance is created and properly initialized
 */
export async function getYTMusicInstance(): Promise<YTMusic> {
  // Return existing instance if available
  if (ytmusicInstance) {
    return ytmusicInstance
  }

  // If already initializing, wait for that promise
  if (isInitializing && initPromise) {
    return initPromise
  }

  // Start initialization
  isInitializing = true
  initPromise = (async () => {
    try {
      const ytmusic = new YTMusic()
      await ytmusic.initialize()
      ytmusicInstance = ytmusic
      console.log('✅ YTMusic API initialized successfully')
      return ytmusic
    } catch (error) {
      console.error('❌ Failed to initialize YTMusic API:', error)
      isInitializing = false
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * Search for songs using YTMusic API
 */
export async function searchSongs(query: string, limit: number = 20) {
  try {
    const ytmusic = await getYTMusicInstance()
    const results = await ytmusic.searchSongs(query) as any[]
    
    // Format results to match our Song interface
    const formattedResults = results.slice(0, limit).map((song: any) => ({
      id: song.videoId,
      title: song.name || 'Unknown Title',
      channel: song.artist?.name || 'Unknown Artist',
      thumbnail: getBestThumbnail(song.thumbnails),
      duration: song.duration || 0,
    }))

    return {
      results: formattedResults,
      nextPageToken: null, // ytmusic-api doesn't support pagination tokens
    }
  } catch (error: any) {
    console.error('YTMusic search error:', error)
    throw error
  }
}

/**
 * Search for videos (music videos)
 */
export async function searchVideos(query: string, limit: number = 20) {
  try {
    const ytmusic = await getYTMusicInstance()
    const results = await ytmusic.searchVideos(query) as any[]
    
    const formattedResults = results.slice(0, limit).map((video: any) => ({
      id: video.videoId,
      title: video.name || 'Unknown Title',
      channel: video.artist?.name || 'Unknown Artist',
      thumbnail: getBestThumbnail(video.thumbnails),
      duration: video.duration || 0,
    }))

    return {
      results: formattedResults,
      nextPageToken: null,
    }
  } catch (error: any) {
    console.error('YTMusic video search error:', error)
    throw error
  }
}

/**
 * General search (songs + videos combined)
 */
export async function search(query: string, limit: number = 20) {
  try {
    const ytmusic = await getYTMusicInstance()
    const results = await ytmusic.search(query) as any[]
    
    // The search method returns an array of mixed results
    const allItems: any[] = []
    const seenIds = new Set<string>()
    
    // Process results array
    if (Array.isArray(results)) {
      results.forEach((item: any) => {
        const videoId = item.videoId
        if (videoId && !seenIds.has(videoId)) {
          seenIds.add(videoId)
          allItems.push({
            id: videoId,
            title: item.name || 'Unknown Title',
            channel: item.artist?.name || 'Unknown Artist',
            thumbnail: getBestThumbnail(item.thumbnails),
            duration: item.duration || 0,
            type: item.type || 'song',
          })
        }
      })
    }

    return {
      results: allItems.slice(0, limit),
      nextPageToken: null,
    }
  } catch (error: any) {
    console.error('YTMusic general search error:', error)
    throw error
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string) {
  try {
    const ytmusic = await getYTMusicInstance()
    const suggestions = await ytmusic.getSearchSuggestions(query)
    return suggestions
  } catch (error: any) {
    console.error('YTMusic suggestions error:', error)
    return []
  }
}

/**
 * Get song details by video ID
 */
export async function getSongDetails(videoId: string) {
  try {
    const ytmusic = await getYTMusicInstance()
    const song = await ytmusic.getSong(videoId) as any
    
    return {
      id: song.videoId,
      title: song.name || 'Unknown Title',
      channel: song.artist?.name || 'Unknown Artist',
      thumbnail: getBestThumbnail(song.thumbnails),
      duration: song.duration || 0,
      album: song.album?.name || null,
      description: song.description || null,
    }
  } catch (error: any) {
    console.error('YTMusic get song error:', error)
    throw error
  }
}

/**
 * Get lyrics for a song
 */
export async function getLyrics(videoId: string) {
  try {
    const ytmusic = await getYTMusicInstance()
    const lyrics = await ytmusic.getLyrics(videoId)
    return lyrics
  } catch (error: any) {
    console.error('YTMusic lyrics error:', error)
    return null
  }
}

/**
 * Helper function to get the best quality thumbnail
 */
function getBestThumbnail(thumbnails: any[] | undefined): string {
  if (!thumbnails || thumbnails.length === 0) {
    return '/assets/music_app_logo.png' // Fallback to app logo
  }
  
  // Sort by width (descending) and get the best quality
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))
  
  // Return medium quality (not the largest to save bandwidth)
  const preferred = sorted.find(t => t.width >= 200 && t.width <= 500) || sorted[0]
  return preferred.url || '/assets/music_app_logo.png'
}

/**
 * Convert ISO 8601 duration to seconds (if needed)
 */
export function parseDuration(duration: string | number): number {
  if (typeof duration === 'number') {
    return duration
  }
  
  if (!duration || typeof duration !== 'string') {
    return 0
  }
  
  // If it's already in seconds format (e.g., "180")
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10)
  }
  
  // Parse ISO 8601 duration (e.g., "PT3M30S")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}
