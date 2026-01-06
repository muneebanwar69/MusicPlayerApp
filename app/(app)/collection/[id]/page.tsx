'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePlayerStore, Song } from '@/store/playerStore'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PlayIcon, SearchIcon } from '@/components/icons/NavIcons'
import { LikeButton } from '@/components/ui/LikeButton'
import { useDebounce } from '@/hooks/useDebounce'

export default function CollectionPage() {
  const params = useParams()
  const collectionId = params.id as string
  const [collection, setCollection] = useState<any>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 500)

  const { playSong, addToQueue, setRepeat, currentSong, isPlaying } = usePlayerStore()

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        if (!db) {
          console.error('Firestore not initialized')
          return
        }
        const docRef = doc(db, 'collections', collectionId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setCollection({ id: docSnap.id, ...data })
          setSongs(data.songs || [])
        } else {
          toast.error('Collection not found')
        }
      } catch (error) {
        console.error('Error fetching collection:', error)
        toast.error('Failed to load collection')
      } finally {
        setLoading(false)
      }
    }

    if (collectionId) {
      fetchCollection()
    }
  }, [collectionId])

  // Search Effect
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([])
      return
    }

    const searchSongs = async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/youtube/search?query=${encodeURIComponent(debouncedSearch)}`)
        const data = await response.json()

        if (data.quotaExceeded || response.status === 429) {
          toast.error('YouTube API quota exceeded.')
          setSearchResults([])
          return
        }

        if (!response.ok) throw new Error(data.message || 'Search failed')
        setSearchResults(data.results || [])
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    searchSongs()
  }, [debouncedSearch])

  const handleAddSong = async (song: Song) => {
    // Check if song already exists
    if (songs.some(s => s.id === song.id)) {
      toast.error('Song already in collection')
      return
    }

    try {
      const updatedSongs = [...songs, song]
      if (!db) {
        toast.error('Firestore not initialized')
        return
      }
      const collectionRef = doc(db, 'collections', collectionId)

      await updateDoc(collectionRef, {
        songs: updatedSongs,
        songCount: updatedSongs.length,
        updatedAt: Timestamp.now(),
      })

      setSongs(updatedSongs)
      setCollection((prev: any) => ({ ...prev, songs: updatedSongs, songCount: updatedSongs.length }))
      toast.success('Song added to collection')
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error adding song:', error)
      toast.error('Failed to add song')
    }
  }

  const handlePlay = (song: Song) => {
    const { clearQueue } = usePlayerStore.getState()
    clearQueue()
    songs.forEach((s) => addToQueue(s))
    playSong(song)
    toast.success(`Playing ${song.title}`)
  }

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setRepeat('all')
      const { clearQueue } = usePlayerStore.getState()
      clearQueue()
      songs.forEach((song) => addToQueue(song))
      playSong(songs[0])
      toast.success(`Playing ${songs.length} songs`)
    }
  }

  const handleShuffle = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5)
      setRepeat('all')
      const { clearQueue } = usePlayerStore.getState()
      clearQueue()
      shuffled.forEach((song) => addToQueue(song))
      playSong(shuffled[0])
      toast.success(`Shuffling ${songs.length} songs`)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-64 bg-surface-elevated rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-elevated rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">Collection not found</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 pb-32 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-surface dark:bg-gradient-to-br dark:from-primary/10 dark:via-surface-elevated dark:to-secondary/10 border-2 border-border dark:border-white/5 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-end">
          <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl flex items-center justify-center text-6xl font-bold text-white mb-4 md:mb-0">
            {collection.name[0].toUpperCase()}
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary dark:text-white tracking-tight">{collection.name}</h1>
            <p className="text-lg text-text-secondary dark:text-white/60">{songs.length} songs • Collection</p>

            <div className="flex gap-4 pt-2">
              <motion.button
                onClick={handlePlayAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5 fill-current" />
                Play All
              </motion.button>
              <motion.button
                onClick={handleShuffle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md transition-all border border-white/10"
              >
                Shuffle
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white">Add Songs</h2>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs to add..."
            className="w-full pl-12 pr-4 py-4 bg-surface-elevated border-2 border-border dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/30 transition-all"
          />
        </div>

        <AnimatePresence>
          {(isSearching || searchResults.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface-elevated rounded-xl border-2 border-border dark:border-white/5 overflow-hidden backdrop-blur-sm"
            >
              {isSearching ? (
                <div className="p-8 flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-border dark:divide-white/5">
                  {searchResults.map((song) => {
                    const isAdded = songs.some(s => s.id === song.id)
                    return (
                      <div key={song.id} className="flex items-center gap-4 p-4 hover:bg-surface dark:hover:bg-white/5 transition-colors">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image src={song.thumbnail} alt={song.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary dark:text-white truncate">{song.title}</p>
                          <p className="text-sm text-text-secondary dark:text-white/50 truncate">{song.channel}</p>
                        </div>
                        <button
                          onClick={() => !isAdded && handleAddSong(song)}
                          disabled={isAdded}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isAdded
                            ? 'bg-surface dark:bg-white/5 text-text-secondary dark:text-white/30 cursor-not-allowed'
                            : 'bg-surface-elevated dark:bg-white/10 hover:bg-primary hover:text-white text-text-primary dark:text-white border border-border dark:border-transparent'
                            }`}
                        >
                          {isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collection Songs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white">Songs in Collection</h2>
        <div className="space-y-2">
          {songs.length > 0 ? (
            songs.map((song, index) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-elevated dark:bg-surface-elevated/30 backdrop-blur-sm hover:bg-surface dark:hover:bg-surface-elevated/60 transition-all group cursor-pointer border-2 border-border dark:border-white/5 hover:border-primary/30"
                onClick={() => handlePlay(song)}
              >
                <div className="w-10 text-center text-text-secondary dark:text-white/50 font-semibold group-hover:text-primary transition-colors">
                  {currentSong?.id === song.id && isPlaying ? (
                    <div className="w-5 h-5 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : index + 1}
                </div>

                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  <Image src={song.thumbnail} alt={song.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                      <PlayIcon className="w-4 h-4 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate transition-colors ${currentSong?.id === song.id ? 'text-primary' : 'text-text-primary dark:text-white group-hover:text-primary'}`}>
                    {song.title}
                  </p>
                  <p className="text-sm text-text-secondary dark:text-white/50 truncate">{song.channel}</p>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div onClick={(e) => e.stopPropagation()}>
                    <LikeButton song={song} size="small" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-surface-elevated dark:bg-surface-elevated/30 rounded-2xl border-2 border-dashed border-border dark:border-white/10"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-text-primary/60 dark:text-white/60 mb-2">No songs yet</p>
              <p className="text-sm text-text-secondary dark:text-white/40">Search above to add some!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
