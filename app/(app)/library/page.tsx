'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUserStore } from '@/store/userStore'
import { getLikedSongs } from '@/lib/likedSongs'
import { Song } from '@/store/playerStore'
import { usePlayerStore } from '@/store/playerStore'
import { CreateCollectionModal } from '@/components/modals/CreateCollectionModal'
import { InteractiveSongCard } from '@/components/cards/InteractiveSongCard'
import Link from 'next/link'
import Image from 'next/image'

interface Collection {
  id: string
  name: string
  songCount: number
  createdAt: any
  songs?: Song[]
}

export default function LibraryPage() {
  const { user } = useUserStore()
  const { playSong, addToQueue, setRepeat } = usePlayerStore()
  const [collections, setCollections] = useState<Collection[]>([])
  const [likedSongs, setLikedSongs] = useState<Song[]>([])
  const [activeTab, setActiveTab] = useState<'collections' | 'liked'>('collections')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCollections = useCallback(async () => {
    if (!user?.uid || !db) return []
    
    try {
      console.log('📚 Fetching collections for user:', user.uid)
      const collectionsRef = collection(db, 'collections')
      
      // Try with orderBy first, fallback to simple query if index doesn't exist
      let snapshot
      try {
        const q = query(
          collectionsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
      } catch (indexError: any) {
        // If index doesn't exist, fall back to simple query
        console.warn('⚠️ Firestore index not available, using simple query:', indexError.message)
        const simpleQ = query(collectionsRef, where('userId', '==', user.uid))
        snapshot = await getDocs(simpleQ)
      }

      const collectionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Collection[]

      // Sort by createdAt client-side if index wasn't available
      collectionsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })

      console.log('✅ Fetched collections:', collectionsData.length)
      return collectionsData
    } catch (error: any) {
      console.error('❌ Error fetching collections:', error)
      return []
    }
  }, [user?.uid])

  const fetchLikedSongs = useCallback(async () => {
    if (!user?.uid) return []
    
    try {
      console.log('❤️ Fetching liked songs for user:', user.uid)
      const liked = await getLikedSongs(user.uid)
      console.log('✅ Fetched liked songs:', liked.length)
      return liked
    } catch (error: any) {
      console.error('❌ Error fetching liked songs:', error)
      return []
    }
  }, [user?.uid])

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch both in parallel
      const [collectionsData, likedData] = await Promise.all([
        fetchCollections(),
        fetchLikedSongs(),
      ])

      setCollections(collectionsData)
      setLikedSongs(likedData)
    } catch (error: any) {
      console.error('❌ Error fetching library data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, fetchCollections, fetchLikedSongs])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for liked songs changes globally
  useEffect(() => {
    if (!user?.uid) return

    const handleLikedChanged = async () => {
      console.log('🔄 Liked songs changed event, refreshing...')
      const liked = await fetchLikedSongs()
      setLikedSongs(liked)
    }

    window.addEventListener('likedSongsChanged', handleLikedChanged)
    return () => window.removeEventListener('likedSongsChanged', handleLikedChanged)
  }, [user?.uid, fetchLikedSongs])

  const handlePlayAll = (songs: Song[]) => {
    if (songs.length === 0) return
    setRepeat('all')
    const { clearQueue } = usePlayerStore.getState()
    clearQueue()
    songs.forEach((song) => addToQueue(song))
    playSong(songs[0])
  }

  const handlePlayFromList = (song: Song, songList: Song[]) => {
    const { clearQueue } = usePlayerStore.getState()
    clearQueue()
    songList.forEach((s) => addToQueue(s))
    playSong(song)
  }

  const tabs = [
    { id: 'collections' as const, label: 'Collections', count: collections.length },
    { id: 'liked' as const, label: 'Liked Songs', count: likedSongs.length },
  ]

  // Callback when collection is created
  const handleCollectionCreated = useCallback(async () => {
    console.log('📦 Collection created, refreshing...')
    const collectionsData = await fetchCollections()
    setCollections(collectionsData)
  }, [fetchCollections])

  return (
    <div className="min-h-screen pb-32 px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 relative">
      {/* Hero Section with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-surface dark:bg-gradient-to-br dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20 p-4 md:p-8 lg:p-12 mb-6 md:mb-8 border-2 border-border dark:border-white/10 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/20 dark:bg-primary/30 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-secondary/10 dark:bg-secondary/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-secondary">
            Your Library
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-text-secondary dark:text-white/60 mb-4 md:mb-8">Your personal music collection</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:gap-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-surface-elevated dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 lg:p-6 border border-border dark:border-white/10 shadow-lg"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 md:mb-2">{collections.length}</div>
              <div className="text-xs sm:text-sm md:text-base text-text-secondary dark:text-white/60">Collections</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-surface-elevated dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 lg:p-6 border border-border dark:border-white/10 shadow-lg"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-secondary mb-1 md:mb-2">{likedSongs.length}</div>
              <div className="text-xs sm:text-sm md:text-base text-text-secondary dark:text-white/60">Liked Songs</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1.5 md:gap-2 mb-6 md:mb-8 bg-surface-elevated backdrop-blur-xl p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-border dark:border-white/5 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 md:px-6 py-2.5 md:py-4 rounded-lg md:rounded-xl font-medium md:font-semibold text-sm md:text-base transition-all duration-300 ${activeTab === tab.id
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
              : 'text-text-secondary dark:text-white/50 hover:text-text-primary dark:hover:text-white/80 hover:bg-surface dark:hover:bg-white/5'
              }`}
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2">
              <span className="truncate">{tab.id === 'liked' ? <span className="hidden xs:inline">{tab.label}</span> : tab.label}</span>
              <span className={`xs:hidden ${tab.id === 'liked' ? 'inline' : 'hidden'}`}>Liked</span>
              {tab.count > 0 && (
                <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface dark:bg-white/10'
                  }`}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Collections Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'collections' && (
          <motion.div
            key="collections"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-text-primary dark:text-white">My Collections</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-primary to-secondary rounded-full font-medium md:font-semibold text-sm md:text-base shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center gap-1.5 md:gap-2 flex-shrink-0"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Collection</span>
                <span className="sm:hidden">New</span>
              </motion.button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 md:h-64 bg-surface-elevated/50 rounded-xl md:rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : collections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {collections.map((collection, index) => (
                  <Link key={collection.id} href={`/collection/${collection.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative h-36 sm:h-48 md:h-64 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer border border-border dark:border-white/10 hover:border-primary/50 transition-all shadow-lg active:scale-98"
                    >
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20" />

                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 dark:from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-primary/20 via-transparent to-transparent" />

                      {/* Content */}
                      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg md:text-2xl font-bold text-white shadow-lg">
                            {collection.name[0].toUpperCase()}
                          </div>
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg">
                            <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 text-text-primary dark:text-white group-hover:text-primary transition-colors truncate">
                            {collection.name}
                          </h3>
                          <p className="text-xs md:text-sm text-text-secondary dark:text-white/60 flex items-center gap-1.5 md:gap-2">
                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                            {collection.songCount || 0} songs
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 md:py-20 bg-surface-elevated dark:bg-surface-elevated/30 rounded-xl md:rounded-3xl border-2 border-dashed border-border dark:border-white/10 shadow-lg"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-text-primary dark:text-white">No collections yet</h3>
                <p className="text-sm md:text-base text-text-secondary dark:text-white/60 mb-4 md:mb-6 px-4">Create your first collection to organize your music</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-primary to-secondary rounded-full font-medium md:font-semibold text-sm md:text-base shadow-lg shadow-primary/30"
                >
                  Create Collection
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Liked Songs Tab */}
        {activeTab === 'liked' && (
          <motion.div
            key="liked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 md:space-y-6"
          >
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface-elevated/50 rounded-lg md:rounded-xl animate-pulse" />
                ))}
              </div>
            ) : likedSongs.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary dark:text-white">{likedSongs.length} Liked</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayAll(likedSongs)}
                    className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-primary to-secondary rounded-full font-medium md:font-semibold text-sm md:text-base shadow-lg shadow-primary/30 flex items-center gap-1.5 md:gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
                    </svg>
                    <span className="hidden sm:inline">Play All</span>
                    <span className="sm:hidden">Play</span>
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {likedSongs.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <InteractiveSongCard
                        song={song}
                        size="small"
                        onPlay={(s) => handlePlayFromList(s, likedSongs)}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 md:py-20 bg-surface-elevated dark:bg-surface-elevated/30 rounded-xl md:rounded-3xl border-2 border-dashed border-border dark:border-white/10 shadow-lg"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 md:w-12 md:h-12 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-text-primary dark:text-white">No liked songs yet</h3>
                <p className="text-sm md:text-base text-text-secondary dark:text-white/60 px-4">Songs you like will appear here</p>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCollectionCreated={handleCollectionCreated}
      />
    </div>
  )
}
