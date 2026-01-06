'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/store/playerStore'

interface LyricLine {
  time: number // in seconds
  text: string
}

interface LyricsDisplayProps {
  onSeek?: (time: number) => void
  className?: string
}

export function LyricsDisplay({ onSeek, className = '' }: LyricsDisplayProps) {
  const { currentSong, currentTime, youtubePlayer, isPlaying } = usePlayerStore()
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [rawLyrics, setRawLyrics] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeLine, setActiveLine] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!currentSong?.id) {
      setLyrics([])
      setRawLyrics(null)
      setError(null)
      return
    }

    const fetchLyrics = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Include title and artist for better lyrics matching
        const params = new URLSearchParams({
          videoId: currentSong.id,
          ...(currentSong.title && { title: currentSong.title }),
          ...(currentSong.channel && { artist: currentSong.channel }),
        })
        
        const response = await fetch(`/api/lyrics?${params}`)
        const data = await response.json()
        
        if (data.lyrics) {
          // Handle different formats - could be string or object
          let lyricsText = ''
          if (typeof data.lyrics === 'string') {
            lyricsText = data.lyrics
          } else if (data.lyrics.description) {
            lyricsText = data.lyrics.description
          } else if (data.lyrics.text) {
            lyricsText = data.lyrics.text
          } else if (data.lyrics.lyrics) {
            lyricsText = data.lyrics.lyrics
          }
          
          if (lyricsText) {
            setRawLyrics(lyricsText)
            
            // Parse lyrics into lines with estimated timestamps
            const parsedLyrics = parseLyrics(lyricsText, currentSong.duration || 180)
            setLyrics(parsedLyrics)
          } else {
            setRawLyrics(null)
            setLyrics([])
            setError('Lyrics not available for this song')
          }
        } else {
          setRawLyrics(null)
          setLyrics([])
          setError('Lyrics not available for this song')
        }
      } catch (err) {
        console.error('Error fetching lyrics:', err)
        setError('Failed to load lyrics')
        setLyrics([])
        setRawLyrics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLyrics()
  }, [currentSong?.id, currentSong?.duration, currentSong?.title, currentSong?.channel])

  // Update active line based on current time
  useEffect(() => {
    if (lyrics.length === 0) return

    let newActiveLine = 0
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        newActiveLine = i
      } else {
        break
      }
    }
    
    if (newActiveLine !== activeLine) {
      setActiveLine(newActiveLine)
    }
  }, [currentTime, lyrics, activeLine])

  // Auto-scroll to active line
  useEffect(() => {
    if (lineRefs.current[activeLine] && containerRef.current) {
      const lineElement = lineRefs.current[activeLine]
      const container = containerRef.current
      
      if (lineElement) {
        const lineRect = lineElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const lineCenter = lineRect.top + lineRect.height / 2
        const containerCenter = containerRect.top + containerRect.height / 2
        const scrollOffset = lineCenter - containerCenter
        
        container.scrollBy({
          top: scrollOffset,
          behavior: 'smooth'
        })
      }
    }
  }, [activeLine])

  // Handle click on lyric line to seek
  const handleLineClick = useCallback((line: LyricLine, index: number) => {
    if (youtubePlayer && typeof youtubePlayer.seekTo === 'function') {
      try {
        youtubePlayer.seekTo(line.time, true)
        setActiveLine(index)
        if (onSeek) {
          onSeek(line.time)
        }
      } catch (error) {
        console.error('Failed to seek:', error)
      }
    }
  }, [youtubePlayer, onSeek])

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
        />
        <p className="mt-4 text-white/60 text-sm">Loading lyrics...</p>
      </div>
    )
  }

  if (error || lyrics.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"
        >
          <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </motion.div>
        <p className="text-white/50 text-lg font-medium mb-2">No Lyrics Available</p>
        <p className="text-white/30 text-sm">Lyrics aren&apos;t available for this song yet</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${className}`}
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="py-8 px-4 space-y-4">
        {lyrics.map((line, index) => {
          const isActive = index === activeLine
          const isPast = index < activeLine
          const isFuture = index > activeLine
          
          return (
            <motion.div
              key={index}
              ref={(el) => { lineRefs.current[index] = el }}
              onClick={() => handleLineClick(line, index)}
              className={`
                cursor-pointer transition-all duration-300 px-4 py-3 rounded-xl
                ${isActive ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}
              `}
              whileHover={{ scale: isActive ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p
                className={`
                  text-lg md:text-2xl font-medium transition-all duration-500
                  ${isActive 
                    ? 'text-white scale-100' 
                    : isPast 
                      ? 'text-white/40' 
                      : 'text-white/30'
                  }
                `}
                style={{
                  textShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {line.text || '♪ ♪ ♪'}
              </p>
            </motion.div>
          )
        })}
        {/* Bottom padding for scroll */}
        <div className="h-32" />
      </div>
    </div>
  )
}

/**
 * Parse raw lyrics text into timestamped lines
 * Since ytmusic-api doesn't always provide timestamps, we estimate them
 */
function parseLyrics(rawLyrics: string, songDuration: number): LyricLine[] {
  if (!rawLyrics) return []
  
  // Split by newlines and filter empty lines
  const lines = rawLyrics
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  if (lines.length === 0) return []
  
  // Check if lyrics have timestamps (e.g., [00:30.50] Lyrics here)
  const timestampRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2}))?\]/
  const hasTimestamps = lines.some(line => timestampRegex.test(line))
  
  if (hasTimestamps) {
    // Parse timestamped lyrics
    return lines
      .map(line => {
        const match = line.match(timestampRegex)
        if (match) {
          const minutes = parseInt(match[1], 10)
          const seconds = parseInt(match[2], 10)
          const centiseconds = match[3] ? parseInt(match[3], 10) : 0
          const time = minutes * 60 + seconds + centiseconds / 100
          const text = line.replace(timestampRegex, '').trim()
          return { time, text }
        }
        return null
      })
      .filter((line): line is LyricLine => line !== null && line.text.length > 0)
      .sort((a, b) => a.time - b.time)
  }
  
  // Estimate timestamps based on song duration
  // Leave some time at start and end for intro/outro
  const introTime = Math.min(10, songDuration * 0.05) // 5% or 10s intro
  const outroTime = Math.min(10, songDuration * 0.05) // 5% or 10s outro
  const lyricsDuration = songDuration - introTime - outroTime
  const timePerLine = lyricsDuration / lines.length
  
  return lines.map((text, index) => ({
    time: introTime + index * timePerLine,
    text
  }))
}
