import { analytics } from './firebase'
import { logEvent, EventParams } from 'firebase/analytics'

/**
 * Log an analytics event
 * Only works on client side when analytics is initialized
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window !== 'undefined' && analytics) {
    try {
      logEvent(analytics, eventName, params)
    } catch (error) {
      // Silently fail if analytics is not available
      console.debug('Analytics event failed:', error)
    }
  }
}

/**
 * Track page views
 */
export function trackPageView(pageName: string) {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  })
}

/**
 * Track music playback events
 */
export function trackPlaySong(songId: string, songTitle: string) {
  trackEvent('play_song', {
    song_id: songId,
    song_title: songTitle,
  })
}

export function trackPauseSong(songId: string) {
  trackEvent('pause_song', {
    song_id: songId,
  })
}

export function trackSearch(query: string, resultCount: number) {
  trackEvent('search', {
    search_term: query,
    result_count: resultCount,
  })
}

export function trackAddToCollection(collectionId: string, songId: string) {
  trackEvent('add_to_collection', {
    collection_id: collectionId,
    song_id: songId,
  })
}

export function trackCreateCollection(collectionName: string) {
  trackEvent('create_collection', {
    collection_name: collectionName,
  })
}
