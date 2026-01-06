import { Song } from '@/store/playerStore'
import { getSearchHistory } from './searchHistory'
import { getRecentlyPlayed } from './playHistory'
import { getLikedSongs } from './likedSongs'
import { cachedYouTubeSearch, batchYouTubeSearch } from './apiCache'

// Popular music categories for random recommendations
const MUSIC_CATEGORIES = [
  'pop hits 2024',
  'top rock songs',
  'best hip hop',
  'electronic dance music',
  'jazz classics',
  'classical music',
  'country hits',
  'r&b soul',
  'reggae music',
  'blues music',
  'indie pop',
  'alternative rock',
  'edm hits',
  'latin music hits',
  'kpop hits',
  'metal music',
  'folk music',
  'soul classics',
  'funk music',
  'disco hits',
  'lofi beats',
  'chill music',
  'workout music',
  'party songs',
]

/**
 * Get random songs from various categories (initial recommendations)
 * Uses caching to minimize API calls
 */
export async function getRandomRecommendations(limit: number = 20): Promise<Song[]> {
  try {
    // Pick 2-3 random categories (reduced to minimize API calls)
    const randomCategories = MUSIC_CATEGORIES
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    const allSongs: Song[] = []
    const seenIds = new Set<string>()

    // Use batch search with caching
    const results = await batchYouTubeSearch(randomCategories)

    // Process results
    for (const [category, data] of results) {
      if (data.error) {
        console.warn(`Failed to fetch category "${category}"`)
        continue
      }

      const songs = (data.results || []).slice(0, 8).map((item: any) => ({
        id: item.id,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        duration: item.duration || 0,
      }))

      songs.forEach((song: Song) => {
        if (!seenIds.has(song.id) && song.id) {
          allSongs.push(song)
          seenIds.add(song.id)
        }
      })
    }

    // Shuffle and return limited results
    const shuffled = allSongs.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit)
  } catch (error) {
    console.error('Error getting random recommendations:', error)
    return []
  }
}

/**
 * Get personalized recommendations based on search history
 * Uses caching to minimize API calls - only makes 1-2 API calls max
 */
export async function getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<Song[]> {
  try {
    if (!userId) {
      // If no user, return random recommendations
      return getRandomRecommendations(limit)
    }

    // Get search history
    const searchHistory = await getSearchHistory(userId)
    
    // If no search history, use random recommendations
    if (searchHistory.length === 0) {
      return getRandomRecommendations(limit)
    }

    // Get recently played and liked songs for context
    const [recentSongs, likedSongs] = await Promise.all([
      getRecentlyPlayed(userId, 10),
      getLikedSongs(userId),
    ])

    const allSongs: Song[] = []
    const seenIds = new Set<string>()

    // Add recent songs
    recentSongs.forEach((song) => {
      if (!seenIds.has(song.id) && song.id) {
        allSongs.push(song)
        seenIds.add(song.id)
      }
    })

    // Add liked songs
    likedSongs.slice(0, 5).forEach((song) => {
      if (!seenIds.has(song.id) && song.id) {
        allSongs.push(song)
        seenIds.add(song.id)
      }
    })

    // Use only top 2 search queries to minimize API calls (with caching)
    const searchQueries = searchHistory.slice(0, 2)
    
    // Use batch search with caching - this deduplicates and caches
    const results = await batchYouTubeSearch(searchQueries)

    // Process results
    for (const [query, data] of results) {
      if (data.error) {
        console.warn(`Failed to fetch for query "${query}"`)
        continue
      }

      const songs = (data.results || []).slice(0, 5).map((item: any) => ({
        id: item.id,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        duration: item.duration || 0,
      }))
      
      songs.forEach((song: Song) => {
        if (!seenIds.has(song.id) && song.id && allSongs.length < limit) {
          allSongs.push(song)
          seenIds.add(song.id)
        }
      })
    }

    // If we don't have enough songs, fill with random (also cached)
    if (allSongs.length < limit) {
      const randomSongs = await getRandomRecommendations(limit - allSongs.length)
      randomSongs.forEach((song) => {
        if (!seenIds.has(song.id) && song.id) {
          allSongs.push(song)
          seenIds.add(song.id)
        }
      })
    }

    // Shuffle and return
    return allSongs.sort(() => Math.random() - 0.5).slice(0, limit)
  } catch (error) {
    console.error('Error getting personalized recommendations:', error)
    return getRandomRecommendations(limit)
  }
}
