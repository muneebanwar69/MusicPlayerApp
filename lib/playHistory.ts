import { getFirebaseFirestore } from './firebase'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { Song } from '@/store/playerStore'

/**
 * Save a song to play history
 */
export async function saveToPlayHistory(userId: string, song: Song) {
  try {
    if (typeof window === 'undefined') {
      console.warn('Cannot save play history: window not available')
      return
    }
    
    const db = getFirebaseFirestore()

    if (!userId) {
      console.warn('Cannot save play history: no user ID')
      return
    }

    if (!song || !song.id) {
      console.warn('Cannot save play history: invalid song data')
      return
    }

    console.log('💾 Saving play history:', { userId, songId: song.id, songTitle: song.title })

    const historyRef = doc(db, 'playHistory', userId)
    const historyDoc = await getDoc(historyRef)

    let history: Song[] = []
    if (historyDoc.exists()) {
      history = historyDoc.data().history || []
      console.log('📚 Existing history:', history.length, 'songs')
    } else {
      console.log('📚 Creating new history document')
    }

    // Remove if already exists (to avoid duplicates)
    const beforeLength = history.length
    history = history.filter((s: Song) => s.id !== song.id)
    if (beforeLength !== history.length) {
      console.log('🔄 Removed duplicate song from history')
    }

    // Add to beginning
    history.unshift({
      ...song,
      addedAt: Date.now(),
    })

    // Keep only last 50 songs
    history = history.slice(0, 50)

    // Save to Firestore
    await setDoc(historyRef, {
      history,
      lastUpdated: Timestamp.now(),
    }, { merge: true })

    console.log('✅ Play history saved successfully! Total songs:', history.length)
  } catch (error: any) {
    console.error('❌ Failed to save play history:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId,
      songId: song?.id,
    })
    throw error // Re-throw so caller can handle it
  }
}

/**
 * Get recently played songs
 */
export async function getRecentlyPlayed(userId: string, limitCount: number = 10): Promise<Song[]> {
  try {
    if (typeof window === 'undefined') {
      console.warn('Cannot get play history: window not available')
      return []
    }

    if (!userId) {
      console.warn('Cannot get play history: no user ID')
      return []
    }

    const db = getFirebaseFirestore()
    console.log('📖 Fetching play history for user:', userId)

    const historyRef = doc(db, 'playHistory', userId)
    const historyDoc = await getDoc(historyRef)

    if (!historyDoc.exists()) {
      console.log('📖 No play history found for user')
      return []
    }

    const history = historyDoc.data().history || []
    console.log('📖 Found', history.length, 'songs in history')
    
    // Return last N songs
    const result = history.slice(0, limitCount)
    console.log('📖 Returning', result.length, 'songs')
    return result
  } catch (error: any) {
    console.error('❌ Failed to get play history:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId,
    })
    return []
  }
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
