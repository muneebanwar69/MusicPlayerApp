import { db } from './firebase'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'

/**
 * Save a search query to history
 */
export async function saveSearchQuery(userId: string, query: string) {
  try {
    if (typeof window === 'undefined' || !db) return

    if (!userId || !query || query.trim().length < 2) return

    const historyRef = doc(db, 'searchHistory', userId)
    const historyDoc = await getDoc(historyRef)

    let queries: string[] = []
    if (historyDoc.exists()) {
      queries = historyDoc.data().queries || []
    }

    // Remove if already exists (to avoid duplicates)
    queries = queries.filter((q) => q.toLowerCase() !== query.toLowerCase().trim())

    // Add to beginning
    queries.unshift(query.trim())

    // Keep only last 20 queries
    queries = queries.slice(0, 20)

    // Save to Firestore
    await setDoc(historyRef, {
      queries,
      lastUpdated: Timestamp.now(),
    }, { merge: true })
  } catch (error) {
    console.error('Failed to save search query:', error)
  }
}

/**
 * Get search history
 */
export async function getSearchHistory(userId: string): Promise<string[]> {
  try {
    if (typeof window === 'undefined' || !db) return []

    const historyRef = doc(db, 'searchHistory', userId)
    const historyDoc = await getDoc(historyRef)

    if (!historyDoc.exists()) return []

    return historyDoc.data().queries || []
  } catch (error) {
    console.error('Failed to get search history:', error)
    return []
  }
}
