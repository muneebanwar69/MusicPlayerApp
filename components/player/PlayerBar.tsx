'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { Controls } from './Controls'
import { ProgressBar } from './ProgressBar'
import { LikeButton } from '@/components/ui/LikeButton'
import { LyricsDisplay } from './LyricsDisplay'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { trackPlaySong, trackPauseSong } from '@/lib/analytics'
import { YouTubePlayer } from './YouTubePlayer'
import Image from 'next/image'

export function PlayerBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const {
    currentSong,
    isPlaying,
    setCurrentSong,
  } = usePlayerStore()
  const router = useRouter()

  const handleClose = () => {
    // Stop playback first
    const { youtubePlayer, setPlaying, setYouTubePlayer } = usePlayerStore.getState()
    
    try {
      if (youtubePlayer) {
        youtubePlayer.stopVideo()
        youtubePlayer.destroy()
      }
    } catch (error) {
      console.error('Error stopping player:', error)
    }
    
    // Reset player state
    setPlaying(false)
    setYouTubePlayer(null)
    setCurrentSong(null)
    setIsExpanded(false)
    setShowLyrics(false)
  }

  // YouTube IFrame API handles all audio playback
  // No HTML5 audio element needed

  if (!currentSong) return null

  return (
    <>
      <YouTubePlayer />
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-0 md:bottom-6 left-0 right-0 md:left-64 z-50 px-0 md:px-6 pointer-events-none"
        >
          <div className="pointer-events-auto bg-[#0a0a0f]/80 backdrop-blur-2xl border-t md:border border-white/10 md:rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 blur-sm" />

            {/* Expand Button */}
            <motion.button
              whileHover={{ scale: 1.1, color: "#fff" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className="absolute top-2 right-12 md:right-12 p-1.5 rounded-full text-white/50 hover:bg-white/10 transition-colors z-50"
              aria-label="Expand player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </motion.button>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, color: "#fff" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-2 right-2 p-1.5 rounded-full text-white/50 hover:bg-white/10 transition-colors z-50"
              aria-label="Close player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </motion.button>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsExpanded(true)}
                  className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg shadow-primary/20"
                >
                  <Image
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </motion.div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm font-bold text-white truncate">{currentSong.title}</p>
                  <p className="text-xs text-text-secondary truncate">{currentSong.channel}</p>
                </div>
              </div>
              <ProgressBar />
              <Controls />
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsExpanded(true)}
                className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-black/50 cursor-pointer group-hover:shadow-primary/20 transition-all duration-300"
              >
                <Image
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </motion.div>

              <div className="flex-1 min-w-0 max-w-[200px] lg:max-w-[300px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{currentSong.title}</h3>
                    <p className="text-xs text-text-secondary truncate hover:text-primary transition-colors cursor-pointer">{currentSong.channel}</p>
                  </div>
                  <LikeButton song={currentSong} size="small" />
                </div>
              </div>

              <div className="flex-1 max-w-2xl px-4">
                <div className="flex flex-col gap-2">
                  <Controls />
                  <ProgressBar />
                </div>
              </div>

              <div className="w-32 flex justify-end">
                {/* Future Volume Control */}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Background Blur */}
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src={currentSong.thumbnail}
                alt="Background"
                fill
                className="object-cover opacity-60 blur-3xl scale-125"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-4 md:p-8 overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="text-center">
                  <h2 className="text-sm font-medium tracking-widest text-white/60 uppercase">Now Playing</h2>
                </div>
                {/* Lyrics Toggle Button */}
                <motion.button
                  onClick={() => setShowLyrics(!showLyrics)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    showLyrics ? "bg-primary text-white" : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                  title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </motion.button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-7xl mx-auto w-full overflow-hidden">
                {/* Album Art - Shrinks when lyrics shown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                  }}
                  layout
                  className={cn(
                    "relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 transition-all duration-500 flex-shrink-0",
                    showLyrics 
                      ? "w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64" 
                      : "w-full aspect-square max-w-[280px] md:max-w-sm lg:max-w-md"
                  )}
                >
                  <Image
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                  />
                </motion.div>

                {/* Lyrics Panel - Shows when lyrics enabled */}
                <AnimatePresence>
                  {showLyrics && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="flex-1 h-[40vh] md:h-[50vh] lg:h-[60vh] w-full md:max-w-xl bg-black/20 rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden"
                    >
                      <LyricsDisplay className="h-full" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Track Info & Controls - Repositions based on lyrics state */}
                <motion.div 
                  layout
                  className={cn(
                    "flex flex-col w-full gap-4 md:gap-6",
                    showLyrics ? "max-w-full md:max-w-md" : "max-w-xl"
                  )}
                >
                  <div className="space-y-1 md:space-y-2 text-center md:text-left">
                    <h1 className={cn(
                      "font-bold text-white leading-tight transition-all duration-300",
                      showLyrics 
                        ? "text-xl md:text-2xl lg:text-3xl line-clamp-2" 
                        : "text-2xl md:text-4xl lg:text-5xl"
                    )}>
                      {currentSong.title}
                    </h1>
                    <p className={cn(
                      "text-white/70 transition-all duration-300",
                      showLyrics ? "text-sm md:text-base" : "text-lg md:text-xl lg:text-2xl"
                    )}>
                      {currentSong.channel}
                    </p>
                  </div>

                  <div className="w-full">
                    <ProgressBar />
                  </div>

                  <div className="flex justify-center md:justify-start">
                    <Controls />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
