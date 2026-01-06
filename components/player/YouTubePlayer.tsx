'use client'

import { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { trackPlaySong, trackPauseSong } from '@/lib/analytics'
import { saveToPlayHistory } from '@/lib/playHistory'
import { useUserStore } from '@/store/userStore'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// Error Boundary for YouTube Player
interface ErrorBoundaryState {
  hasError: boolean
}

class YouTubePlayerErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('YouTubePlayer Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null // Silently fail - don't break the app
    }
    return this.props.children
  }
}

// Validate YouTube video ID format
function isValidYouTubeId(id: string | undefined): boolean {
  if (!id || typeof id !== 'string') return false
  // YouTube video IDs are typically 11 characters, but can vary
  // Can contain letters, numbers, hyphens, and underscores
  // Minimum 10 characters, maximum 11 characters
  const trimmedId = id.trim()
  return trimmedId.length >= 10 && trimmedId.length <= 11 && /^[a-zA-Z0-9_-]+$/.test(trimmedId)
}

function YouTubePlayerInner() {
  const { currentSong, isPlaying, setPlaying, setYouTubePlayer } = usePlayerStore()
  const { user } = useUserStore()
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [apiReady, setApiReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Load YouTube IFrame API
    if (typeof window === 'undefined') return

    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }

    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        if (window.YT && window.YT.Player) {
          setApiReady(true)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!apiReady || !currentSong || !containerRef.current) {
      return
    }

    // Double-check YT API is ready
    if (!window.YT || !window.YT.Player) {
      console.warn('YouTube API not ready yet')
      return
    }

    // Validate video ID
    if (!currentSong.id) {
      console.error('No video ID provided for song:', currentSong.title)
      toast.error('Invalid song data. Please try another song.')
      return
    }

    const videoId = String(currentSong.id).trim()
    if (!isValidYouTubeId(videoId)) {
      console.error('Invalid YouTube video ID format:', videoId, 'for song:', currentSong.title)
      toast.error('Invalid video ID. Please try another song.')
      return
    }

    // Create or update player
    if (!playerRef.current) {
      try {
        const videoId = String(currentSong.id).trim()
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            setYouTubePlayer(event.target)
            playerRef.current = event.target
            // Don't auto-play - only play if user explicitly clicked play
            // Set initial volume
            try {
              const { volume } = usePlayerStore.getState()
              event.target.setVolume(volume * 100)
            } catch (error) {
              console.error('Set volume failed:', error)
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1
            // YT.PlayerState.PAUSED = 2
            // YT.PlayerState.ENDED = 0
            if (event.data === 1) {
              setPlaying(true)
              if (currentSong && user?.uid) {
                trackPlaySong(currentSong.id, currentSong.title)
                // Save to play history when playback actually starts
                saveToPlayHistory(user.uid, currentSong)
                  .then(() => {
                    console.log('✅ Play history saved:', currentSong.title)
                    // Trigger a custom event to refresh home page
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('songPlayed', { detail: currentSong }))
                    }
                  })
                  .catch((error) => {
                    console.error('❌ Failed to save play history:', error)
                  })
              }
            } else if (event.data === 2) {
              setPlaying(false)
              if (currentSong) {
                trackPauseSong(currentSong.id)
              }
            } else if (event.data === 0) {
              // Video ended, play next
              setPlaying(false)
              const { nextSong } = usePlayerStore.getState()
              nextSong()
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data)
            setPlaying(false)
            // Handle specific error codes
            if (event.data === 2) {
              console.error('Invalid video ID')
            } else if (event.data === 5) {
              console.error('HTML5 player error')
            } else if (event.data === 100) {
              console.error('Video not found')
            } else if (event.data === 101 || event.data === 150) {
              console.error('Video not allowed to be played in embedded players')
            }
          },
        },
        })
      } catch (error: any) {
        console.error('Failed to create YouTube player:', error)
        toast.error('Failed to load video. Please try again.')
        setPlaying(false)
        return
      }
    } else {
      // Update existing player
      try {
        // Validate video ID before loading
        if (!currentSong.id || !isValidYouTubeId(currentSong.id)) {
          console.error('Invalid YouTube video ID:', currentSong.id)
          toast.error('Invalid video ID. Please try another song.')
          return
        }

        const currentVideoId = playerRef.current.getVideoData()?.video_id
        const newVideoId = String(currentSong.id).trim()
        if (currentVideoId !== newVideoId) {
          playerRef.current.loadVideoById(newVideoId)
        }
        if (isPlaying) {
          playerRef.current.playVideo()
        } else {
          playerRef.current.pauseVideo()
        }
      } catch (error) {
        console.error('Player update failed:', error)
      }
    }

    return () => {
      // Cleanup handled by YouTube API
    }
  }, [apiReady, currentSong, isPlaying, setPlaying])

  // Handle play/pause changes
  useEffect(() => {
    if (!playerRef.current || !apiReady || !currentSong) return

    try {
      const currentVideoId = playerRef.current.getVideoData()?.video_id
      if (currentVideoId === currentSong.id) {
        if (isPlaying) {
          playerRef.current.playVideo()
        } else {
          playerRef.current.pauseVideo()
        }
      }
    } catch (error) {
      console.error('Error controlling player:', error)
    }
  }, [isPlaying, apiReady, currentSong])

  // Don't render anything on server
  if (!mounted) return null

  // Hidden container for YouTube player
  return (
    <div
      ref={containerRef}
      className="fixed opacity-0 pointer-events-none -z-50"
      style={{ width: '1px', height: '1px' }}
    />
  )
}

// Export the wrapped component
export function YouTubePlayer() {
  return (
    <YouTubePlayerErrorBoundary>
      <YouTubePlayerInner />
    </YouTubePlayerErrorBoundary>
  )
}
