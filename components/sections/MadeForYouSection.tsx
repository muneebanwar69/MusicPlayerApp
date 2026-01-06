'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { usePlayerStore } from '@/store/playerStore'
import { getPersonalizedRecommendations, getRandomRecommendations } from '@/lib/recommendations'
import { Song } from '@/store/playerStore'
import { InteractiveSongCard } from '@/components/cards/InteractiveSongCard'
import Link from 'next/link'

export function MadeForYouSection() {
  const { user } = useUserStore()
  const { playSong, addToQueue, setRepeat } = usePlayerStore()
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        let songs: Song[] = []
        
        if (user?.uid) {
          // Try personalized recommendations first (will return random if no search history)
          songs = await getPersonalizedRecommendations(user.uid, 8)
        }
        
        // If no songs returned or not logged in, use random recommendations
        if (songs.length === 0) {
          songs = await getRandomRecommendations(8)
        }
        
        setRecommendedSongs(songs)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        // Fallback to random
        const songs = await getRandomRecommendations(8)
        setRecommendedSongs(songs)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-surface-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (recommendedSongs.length > 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendedSongs.map((song) => (
            <InteractiveSongCard key={song.id} song={song} size="small" />
          ))}
        </div>
        <div className="flex justify-center">
          <Link href="/dj">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors text-white"
            >
              See More Recommendations
            </motion.button>
          </Link>
        </div>
      </div>
    )
  }

  // Fallback to mix cards if no recommendations
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { name: 'Daily Mix 1', gradient: 'from-purple-500 to-pink-500' },
        { name: 'Daily Mix 2', gradient: 'from-blue-500 to-cyan-500' },
        { name: 'Daily Mix 3', gradient: 'from-green-500 to-emerald-500' },
        { name: 'Chill Mix', gradient: 'from-orange-500 to-red-500' },
      ].map((mix, i) => (
        <Link key={i} href="/dj">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`h-48 rounded-lg bg-gradient-to-br ${mix.gradient} p-6 flex flex-col justify-end cursor-pointer`}
          >
            <h3 className="text-xl font-bold text-white">{mix.name}</h3>
            <p className="text-sm text-white/90">Your personalized mix</p>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
