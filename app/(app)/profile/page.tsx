'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import { useUserStore } from '@/store/userStore'
import { usePlayerStore } from '@/store/playerStore'
import { getLikedSongs } from '@/lib/likedSongs'
import { getRecentlyPlayed } from '@/lib/playHistory'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import { Song } from '@/store/playerStore'
import { auth, getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { InteractiveSongCard } from '@/components/cards/InteractiveSongCard'

export default function ProfilePage() {
  const { user, displayName, photoURL } = useUserStore()
  const { playSong, addToQueue, setRepeat, clearQueue } = usePlayerStore()
  const router = useRouter()
  const [stats, setStats] = useState({
    likedSongs: 0,
    collections: 0,
    recentSongs: 0,
  })
  const [topSongs, setTopSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        // Fetch liked songs count
        const liked = await getLikedSongs(user.uid)
        
        // Fetch collections count
        const db = getFirebaseFirestore()
        const collectionsRef = collection(db, 'collections')
        const collectionsQuery = query(
          collectionsRef,
          where('userId', '==', user.uid)
        )
        const collectionsSnapshot = await getDocs(collectionsQuery)
        
        // Fetch recent songs
        const recent = await getRecentlyPlayed(user.uid, 20)
        
        setStats({
          likedSongs: liked.length,
          collections: collectionsSnapshot.size,
          recentSongs: recent.length,
        })
        
        // Set top songs (recently played, limited to 6)
        setTopSongs(recent.slice(0, 6))
      } catch (error) {
        console.error('Error fetching profile data:', error)
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [user?.uid])

  const handleLogout = async () => {
    try {
      const authInstance = auth || getFirebaseAuth()
      await signOut(authInstance)
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      setRepeat('all')
      clearQueue()
      topSongs.forEach((song) => addToQueue(song))
      playSong(topSongs[0])
      toast.success(`Playing ${topSongs.length} songs`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            {photoURL ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/50 shadow-2xl">
                <Image
                  src={photoURL}
                  alt={displayName || 'User'}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold border-4 border-primary/50 shadow-2xl">
                {(displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{displayName || 'User'}</h1>
            <p className="text-text-secondary mb-4">{user?.email}</p>
            
            {/* Stats */}
            {loading ? (
              <div className="flex gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-20 h-16 bg-surface-elevated rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex gap-6 flex-wrap">
                <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                  <p className="text-2xl font-bold text-primary">{stats.likedSongs}</p>
                  <p className="text-sm text-text-secondary">Liked Songs</p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                  <p className="text-2xl font-bold text-primary">{stats.collections}</p>
                  <p className="text-sm text-text-secondary">Collections</p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                  <p className="text-2xl font-bold text-primary">{stats.recentSongs}</p>
                  <p className="text-sm text-text-secondary">Recent Plays</p>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-6 py-3 rounded-lg bg-surface-elevated hover:bg-red-500/10 text-text-secondary hover:text-red-400 border border-border hover:border-red-500/50 transition-all flex items-center gap-2"
            aria-label="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </motion.button>
        </div>
      </motion.div>

      {/* Top Songs Section */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Top Songs</h2>
          {topSongs.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAll}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              aria-label="Play all top songs"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
              </svg>
              Play All
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-surface-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : topSongs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topSongs.map((song) => (
              <InteractiveSongCard key={song.id} song={song} size="small" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg mb-2">No songs yet</p>
            <p className="text-sm">Start playing music to see your top songs here</p>
          </div>
        )}
      </motion.div>

      {/* Quick Links */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/library">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-surface-elevated rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Liked Songs</h3>
                  <p className="text-sm text-text-secondary">View all your liked songs</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/library">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-surface-elevated rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Your Library</h3>
                  <p className="text-sm text-text-secondary">Collections and playlists</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/search">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-surface-elevated rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Search</h3>
                  <p className="text-sm text-text-secondary">Discover new music</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}