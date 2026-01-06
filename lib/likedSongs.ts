import { getFirebaseFirestore } from './firebase'
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore'
import { Song } from '@/store/playerStore'

/**
 * Like a song
 */
export async function likeSong(userId: string, song: Song) {
  try {
    if (typeof window === 'undefined') {
      console.warn('Cannot like song: window not available')
      throw new Error('Database not available')
    }
    
    const db = getFirebaseFirestore()

    if (!userId) {
      console.warn('Cannot like song: no user ID')
      throw new Error('User not authenticated')
    }

    if (!song || !song.id) {
      console.warn('Cannot like song: invalid song data')
      throw new Error('Invalid song data')
    }

    console.log('❤️ Liking song:', { userId, songId: song.id, songTitle: song.title })

    const likedRef = doc(db, 'likedSongs', userId)
    const likedDoc = await getDoc(likedRef)

    if (likedDoc.exists()) {
      const existingSongs = likedDoc.data().songs || []
      // Check if song is already liked
      const isAlreadyLiked = existingSongs.some((s: Song) => s.id === song.id)
      
      if (isAlreadyLiked) {
        console.log('Song already liked, skipping')
        return
      }

      // Add to existing array
      await updateDoc(likedRef, {
        songs: arrayUnion(song),
        lastUpdated: Timestamp.now(),
      })
      console.log('✅ Song liked successfully')
    } else {
      // Create new document
      await setDoc(likedRef, {
        songs: [song],
        lastUpdated: Timestamp.now(),
      })
      console.log('✅ Created liked songs document and added song')
    }
  } catch (error: any) {
    console.error('❌ Failed to like song:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId,
      songId: song?.id,
    })
    throw error
  }
}

/**
 * Unlike a song
 */
export async function unlikeSong(userId: string, songId: string) {
  try {
    if (typeof window === 'undefined') {
      console.warn('Cannot unlike song: window not available')
      throw new Error('Database not available')
    }
    
    const db = getFirebaseFirestore()

    if (!userId) {
      console.warn('Cannot unlike song: no user ID')
      throw new Error('User not authenticated')
    }

    if (!songId) {
      console.warn('Cannot unlike song: no song ID')
      throw new Error('Invalid song ID')
    }

    console.log('💔 Unliking song:', { userId, songId })

    const likedRef = doc(db, 'likedSongs', userId)
    const likedDoc = await getDoc(likedRef)

    if (!likedDoc.exists()) {
      console.log('No liked songs document found')
      return
    }

    const songs = likedDoc.data().songs || []
    const updatedSongs = songs.filter((s: Song) => s.id !== songId)
    
    if (songs.length === updatedSongs.length) {
      console.log('Song was not in liked songs')
      return
    }
    
    await updateDoc(likedRef, {
      songs: updatedSongs,
      lastUpdated: Timestamp.now(),
    })
    console.log('✅ Song unliked successfully')
  } catch (error: any) {
    console.error('❌ Failed to unlike song:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId,
      songId,
    })
    throw error
  }
}

/**
 * Check if a song is liked
 */
export async function isSongLiked(userId: string, songId: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    
    const db = getFirebaseFirestore()
    const likedRef = doc(db, 'likedSongs', userId)
    const likedDoc = await getDoc(likedRef)

    if (!likedDoc.exists()) return false

    const songs = likedDoc.data().songs || []
    return songs.some((s: Song) => s.id === songId)
  } catch (error) {
    console.error('Failed to check if song is liked:', error)
    return false
  }
}

/**
 * Get all liked songs
 */
export async function getLikedSongs(userId: string): Promise<Song[]> {
  try {
    if (typeof window === 'undefined') {
      console.warn('Cannot get liked songs: window not available')
      return []
    }
    
    const db = getFirebaseFirestore()

    if (!userId) {
      console.warn('Cannot get liked songs: no user ID')
      return []
    }

    console.log('📖 Fetching liked songs for user:', userId)

    const likedRef = doc(db, 'likedSongs', userId)
    const likedDoc = await getDoc(likedRef)

    if (!likedDoc.exists()) {
      console.log('📖 No liked songs document found')
      return []
    }

    const songs = likedDoc.data().songs || []
    console.log('📖 Found', songs.length, 'liked songs')
    return songs
  } catch (error: any) {
    console.error('❌ Failed to get liked songs:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId,
    })
    return []
  }
}
