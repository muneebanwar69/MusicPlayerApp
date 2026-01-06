'use client'

import { usePlayerStore } from '@/store/playerStore'
import { useRef, useEffect } from 'react'
import { formatTime } from '@/lib/utils'

export function ProgressBar() {
  const { progress, setProgress, currentSong, currentTime, setCurrentTime, youtubePlayer } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!youtubePlayer) return

    const updateProgress = () => {
      try {
        const currentTime = youtubePlayer.getCurrentTime()
        const duration = youtubePlayer.getDuration()
        if (duration && duration > 0) {
          const newProgress = (currentTime / duration) * 100
          setProgress(newProgress)
          setCurrentTime(currentTime)
        }
      } catch (error) {
        // Player might not be ready yet
      }
    }

    const interval = setInterval(updateProgress, 100)
    return () => clearInterval(interval)
  }, [youtubePlayer, setProgress, setCurrentTime])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || !youtubePlayer) return

    try {
      const rect = barRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const duration = youtubePlayer.getDuration()
      
      if (duration && duration > 0) {
        const newTime = clickPosition * duration
        youtubePlayer.seekTo(newTime, true)
        setProgress(clickPosition * 100)
        setCurrentTime(newTime)
      }
    } catch (error) {
      console.error('Seek failed:', error)
    }
  }

  return (
    <div className="w-full group">
      <div
        ref={barRef}
        onClick={handleSeek}
        className="relative h-1 bg-gray-700 rounded-full cursor-pointer hover:h-1.5 transition-all"
      >
        {/* Progress fill with gradient */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-text-secondary mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(currentSong?.duration)}</span>
      </div>
    </div>
  )
}
