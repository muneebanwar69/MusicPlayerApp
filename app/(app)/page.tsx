'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, staggerContainer } from '@/lib/animations'
import { getGreeting } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { usePlayerStore } from '@/store/playerStore'
import { getRecentlyPlayed, shuffleArray } from '@/lib/playHistory'
import { getRandomRecommendations } from '@/lib/recommendations'
import Image from 'next/image'
import Link from 'next/link'
import { InteractiveSongCard } from '@/components/cards/InteractiveSongCard'
import { MadeForYouSection } from '@/components/sections/MadeForYouSection'

interface Song {
  id: string
  title: string
  channel: string
  thumbnail: string
  duration: number
}

export default function HomePage() {
  const { displayName, user } = useUserStore()
  const { playSong, currentSong } = usePlayerStore()
  const [recentSongs, setRecentSongs] = useState<Song[]>([])
  const [jumpBackSongs, setJumpBackSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute for dynamic greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchRecentSongs = useCallback(async () => {
    try {
      if (user?.uid) {
        console.log('🔄 Fetching recent songs for user:', user.uid)
        const songs = await getRecentlyPlayed(user.uid, 10)
        console.log('📀 Fetched', songs.length, 'songs from history')

        if (songs.length > 0) {
          const shuffled = shuffleArray(songs)
          setRecentSongs(shuffled)
          const jumpBack = shuffleArray(songs.slice(0, 6))
          setJumpBackSongs(jumpBack)
          console.log('✅ Updated UI with', shuffled.length, 'recent songs')
        } else {
          console.log('📀 No play history, fetching random songs')
          const randomSongs = await getRandomRecommendations(10)
          const shuffled = shuffleArray(randomSongs)
          setRecentSongs(shuffled)
          setJumpBackSongs(shuffleArray(randomSongs.slice(0, 6)))
        }
      } else {
        const randomSongs = await getRandomRecommendations(10)
        const shuffled = shuffleArray(randomSongs)
        setRecentSongs(shuffled)
        setJumpBackSongs(shuffleArray(randomSongs.slice(0, 6)))
      }
    } catch (error) {
      console.error('❌ Error fetching recent songs:', error)
      try {
        const randomSongs = await getRandomRecommendations(10)
        const shuffled = shuffleArray(randomSongs)
        setRecentSongs(shuffled)
        setJumpBackSongs(shuffleArray(randomSongs.slice(0, 6)))
      } catch (fallbackError) {
        console.error('❌ Error fetching random songs:', fallbackError)
        setRecentSongs([])
        setJumpBackSongs([])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    fetchRecentSongs()
  }, [fetchRecentSongs])

  useEffect(() => {
    if (!user?.uid) return
    const handleSongPlayed = () => {
      console.log('🎵 Song played event received, refreshing history...')
      setTimeout(() => fetchRecentSongs(), 1000)
    }
    window.addEventListener('songPlayed', handleSongPlayed)
    return () => window.removeEventListener('songPlayed', handleSongPlayed)
  }, [user?.uid, fetchRecentSongs])

  const greeting = getGreeting()
  const hour = currentTime.getHours()

  return (
    <div className="min-h-screen pb-32 relative">
      {/* Animated Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl dark:bg-gradient-to-br dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20 bg-surface border-2 border-border dark:border-white/10 backdrop-blur-sm shadow-xl p-8 md:p-16 mb-8"
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "linear"
          }}
        />
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 dark:bg-primary/30 blur-[120px] rounded-full pointer-events-none animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/15 dark:bg-secondary/20 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/15 dark:bg-accent/20 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative z-10">
          {/* Time-based Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-block mb-4"
          >
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(29, 185, 84, 0.3)",
                  "0 0 40px rgba(29, 185, 84, 0.5)",
                  "0 0 20px rgba(29, 185, 84, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                {hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙'}
              </motion.span>
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-4"
          >
            <motion.span 
              className="bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent inline-block"
              animate={{ 
                filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {greeting.split(' ')[0]}
            </motion.span>
            {' '}
            <motion.span
              className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent inline-block"
              animate={{ 
                filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {greeting.split(' ').slice(1).join(' ')}
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-semibold relative z-20"
            style={{ color: 'var(--text-primary)' }}
          >
            <motion.span
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              {displayName || 'Music Lover'}
            </motion.span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="inline-block ml-2"
            >
              🎵
            </motion.span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg mt-4 max-w-2xl font-medium relative z-20"
            style={{ color: 'var(--text-primary)' }}
          >
            {hour < 12
              ? "Start your day with some great music"
              : hour < 18
                ? "Keep the energy going with your favorite tracks"
                : "Unwind with some relaxing tunes"}
          </motion.p>
        </div>
      </motion.section>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-6 mb-8 mt-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-surface dark:bg-gradient-to-br dark:from-primary/20 dark:to-primary/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-border dark:border-primary/20 shadow-lg hover:shadow-xl transition-all"
        >
          <motion.div 
            className="text-3xl mb-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🎵
          </motion.div>
          <motion.div 
            className="text-2xl font-bold text-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          >
            {recentSongs.length}
          </motion.div>
          <div className="text-sm font-medium text-text-primary/70 dark:text-white/70 mt-1">Recent Tracks</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-surface dark:bg-gradient-to-br dark:from-secondary/20 dark:to-secondary/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-border dark:border-secondary/20 shadow-lg hover:shadow-xl transition-all"
        >
          <motion.div 
            className="text-3xl mb-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔥
          </motion.div>
          <motion.div 
            className="text-2xl font-bold text-secondary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
          >
            Hot
          </motion.div>
          <div className="text-sm font-medium text-text-primary/70 dark:text-white/70 mt-1">Trending Now</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-surface dark:bg-gradient-to-br dark:from-accent/20 dark:to-accent/5 backdrop-blur-xl rounded-2xl p-6 border-2 border-border dark:border-accent/20 shadow-lg hover:shadow-xl transition-all"
        >
          <motion.div 
            className="text-3xl mb-2"
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            ⚡
          </motion.div>
          <motion.div 
            className="text-2xl font-bold text-accent"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          >
            New
          </motion.div>
          <div className="text-sm font-medium text-text-primary/70 dark:text-white/70 mt-1">Fresh Picks</div>
        </motion.div>
      </motion.div>

      {/* Recently Played */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-12"
      >
        <div className="mb-6">
          <motion.h2 
            className="text-3xl font-bold text-text-primary dark:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.span
              className="inline-block bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-secondary"
              animate={{ 
                filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Recently Played
            </motion.span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="aspect-square bg-surface-elevated/50 rounded-2xl animate-pulse"
              />
            ))
            : recentSongs.length > 0
              ? recentSongs.slice(0, 6).map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <InteractiveSongCard song={song} size="small" />
                </motion.div>
              ))
              : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full text-center py-16 bg-surface-elevated/50 dark:bg-surface-elevated/30 rounded-3xl border border-dashed border-border dark:border-white/10"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-text-primary/80 dark:text-white/70 mb-2">No recent songs</p>
                  <p className="text-sm text-text-primary/60 dark:text-white/50">Start playing music to see your history</p>
                </motion.div>
              )}
        </div>
      </motion.section>

      {/* Jump Back In */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-3xl font-bold text-text-primary dark:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.span
              className="inline-block bg-gradient-to-r from-text-primary via-secondary to-accent bg-clip-text text-transparent dark:from-white dark:via-secondary dark:to-accent"
              animate={{ 
                filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)']
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              Jump Back In
            </motion.span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="h-64 bg-surface-elevated/50 rounded-3xl animate-pulse"
              />
            ))
            : jumpBackSongs.length > 0
              ? jumpBackSongs.slice(0, 3).map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => playSong(song)}
                  className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer border border-border dark:border-white/10 hover:border-primary/50 transition-all shadow-xl hover:shadow-2xl"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={song.thumbnail}
                      alt={song.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Play Button */}
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        whileHover={{ scale: 1.1, rotate: 0 }}
                        className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Song Info */}
                    <div>
                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="font-bold text-xl mb-2 line-clamp-2 drop-shadow-lg"
                      >
                        {song.title}
                      </motion.h3>
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-white/80 line-clamp-1 drop-shadow-lg"
                      >
                        {song.channel}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              ))
              : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full text-center py-16 bg-surface-elevated/50 dark:bg-surface-elevated/30 rounded-3xl border border-dashed border-border dark:border-white/10"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-text-primary/80 dark:text-white/70">Your listening history will appear here</p>
                </motion.div>
              )}
        </div>
      </motion.section>

      {/* Made For You */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-3xl font-bold text-text-primary dark:text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.span
              className="inline-block bg-gradient-to-r from-text-primary via-accent to-primary bg-clip-text text-transparent dark:from-white dark:via-accent dark:to-primary"
              animate={{ 
                filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)']
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              Made For You
            </motion.span>
          </motion.h2>
        </div>
        <MadeForYouSection />
      </motion.section>
    </div>
  )
}
