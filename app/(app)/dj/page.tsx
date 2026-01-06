'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import { useUserStore } from '@/store/userStore'
import { getPersonalizedRecommendations, getRandomRecommendations } from '@/lib/recommendations'
import { Song } from '@/store/playerStore'
import { usePlayerStore } from '@/store/playerStore'
import { InteractiveSongCard } from '@/components/cards/InteractiveSongCard'
import { AudioVisualizer } from '@/components/visualizer/AudioVisualizer'
import Image from 'next/image'

export default function DJPage() {
  const { user } = useUserStore()
  const { playSong, addToQueue, setRepeat, currentSong, isPlaying, togglePlay } = usePlayerStore()
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        let songs: Song[] = []

        if (user?.uid) {
          songs = await getPersonalizedRecommendations(user.uid, 20)
        }

        if (songs.length === 0) {
          songs = await getRandomRecommendations(20)
        }

        setRecommendedSongs(songs)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        const songs = await getRandomRecommendations(20)
        setRecommendedSongs(songs)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user?.uid])

  const handlePlayAll = () => {
    if (recommendedSongs.length === 0) return

    setRepeat('all')
    const { clearQueue } = usePlayerStore.getState()
    clearQueue()

    recommendedSongs.forEach((song) => addToQueue(song))
    playSong(recommendedSongs[0])
  }

  return (
    <div className="min-h-screen pb-32 relative">
      {/* DJ Audio Visualizer Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-12 flex flex-col items-center justify-center py-8"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="w-96 h-96 bg-primary/20 blur-[120px] rounded-full"
            animate={isPlaying ? {
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            } : { scale: 1, opacity: 0.2 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-2 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-secondary">
            DJ Mode
          </h1>
          <p className="text-lg text-text-secondary dark:text-white/60">
            {currentSong ? 'Now Playing' : 'Click play to start the party'}
          </p>
        </motion.div>

        {/* Audio Visualizer Ring */}
        <div className="relative z-10">
          <AudioVisualizer size={320} barCount={60} />
          
          {/* Center Play/Pause Button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-xl shadow-primary/30 flex items-center justify-center cursor-pointer group relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              
              <div className="relative z-10">
                {isPlaying ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex gap-1"
                  >
                    <div className="w-3 h-10 bg-white rounded-sm" />
                    <div className="w-3 h-10 bg-white rounded-sm" />
                  </motion.div>
                ) : (
                  <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
                  </svg>
                )}
              </div>

              {/* Album Art Background (subtle) */}
              {currentSong && (
                <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
                  <Image
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    fill
                    className="object-cover blur-sm"
                  />
                </div>
              )}
            </motion.button>
          </motion.div>

          {/* Now Playing Info */}
          <AnimatePresence>
            {currentSong && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 text-center max-w-md mx-auto"
              >
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent line-clamp-2">
                  {currentSong.title}
                </h3>
                <p className="text-text-secondary dark:text-white/60">{currentSong.channel}</p>
                
                {/* Sound wave animation indicator */}
                {isPlaying && (
                  <motion.div 
                    className="flex items-center justify-center gap-1 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0.3, 0.5, 0.7, 1, 0.7, 0.5, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: [8, 20, 8],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: delay * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Recommended Songs */}
      <div>
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent dark:from-white dark:to-white/60">
              {user?.uid ? 'Recommended For You' : 'Discover Music'}
            </h2>
            {recommendedSongs.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayAll}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-full font-semibold shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
                </svg>
                Play All
              </motion.button>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square bg-surface-elevated/50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : recommendedSongs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendedSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <InteractiveSongCard song={song} size="small" />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-surface-elevated dark:bg-surface-elevated/30 rounded-3xl border-2 border-dashed border-border dark:border-white/10 shadow-lg"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-text-secondary dark:text-white/60">No recommendations available</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
