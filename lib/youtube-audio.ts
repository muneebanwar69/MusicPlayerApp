/**
 * YouTube Audio URL extraction utilities
 * Note: Direct YouTube audio extraction requires server-side processing
 * or a third-party service due to CORS and YouTube's restrictions
 */

/**
 * Get a playable audio URL for a YouTube video
 * This is a placeholder - in production, you'd use:
 * 1. A server-side service with yt-dlp
 * 2. A YouTube audio proxy service
 * 3. YouTube IFrame API with autoplay
 */
export async function getYouTubeAudioUrl(videoId: string): Promise<string | null> {
  try {
    // Try to get audio URL from our API
    const response = await fetch(`/api/audio/${videoId}`)
    const data = await response.json()
    
    if (data.audioUrl) {
      return data.audioUrl
    }
    
    // Fallback: Return null to indicate we need a different approach
    return null
  } catch (error) {
    console.error('Failed to get audio URL:', error)
    return null
  }
}

/**
 * Alternative: Use YouTube IFrame API for playback
 * This requires loading the YouTube IFrame API
 */
export function createYouTubePlayer(
  videoId: string,
  containerId: string,
  onStateChange?: (state: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).YT) {
      // Load YouTube IFrame API
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      
      ;(window as any).onYouTubeIframeAPIReady = () => {
        const player = new (window as any).YT.Player(containerId, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              resolve(event.target)
            },
            onStateChange: (event: any) => {
              if (onStateChange) {
                onStateChange(event.data)
              }
            },
          },
        })
      }
    } else {
      const player = new (window as any).YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
        },
        events: {
          onReady: (event: any) => {
            resolve(event.target)
          },
        },
      })
    }
  })
}
