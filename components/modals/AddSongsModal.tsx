'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Song } from '@/store/playerStore'
import Image from 'next/image'

interface AddSongsModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId: string
  existingSongs: Song[]
  onSongsAdded: () => void
}

export function AddSongsModal({
  isOpen,
  onClose,
  collectionId,
  existingSongs,
  onSongsAdded,
}: AddSongsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Get existing song IDs to avoid duplicates
  const existingSongIds = new Set(existingSongs.map((s) => s.id))

  // Search YouTube for songs
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
        
        // Handle quota exceeded error
        if (data.quotaExceeded || response.status === 429) {
          toast.error('YouTube API quota exceeded. Please try again later.')
          setSearchResults([])
          return
        }
        
        if (!response.ok) {
          throw new Error(data.message || 'Search failed')
        }
        
        setSearchResults(data.results || [])
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Failed to search songs')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    searchSongs()
  }, [debouncedSearch])

  const toggleSongSelection = (song: Song) => {
    // Don't allow selecting songs that are already in the collection
    if (existingSongIds.has(song.id)) {
      toast.error('This song is already in the collection')
      return
    }

    setSelectedSongs((prev) => {
      const isSelected = prev.some((s) => s.id === song.id)
      if (isSelected) {
        return prev.filter((s) => s.id !== song.id)
      } else {
        return [...prev, song]
      }
    })
  }

  const handleAddSongs = async () => {
    if (selectedSongs.length === 0) {
      toast.error('Please select at least one song')
      return
    }

    setIsAdding(true)
    try {
      const db = getFirebaseFirestore()
      const collectionRef = doc(db, 'collections', collectionId)
      const collectionDoc = await getDoc(collectionRef)

      if (!collectionDoc.exists()) {
        toast.error('Collection not found')
        return
      }

      const currentSongs = collectionDoc.data().songs || []
      const updatedSongs = [...currentSongs, ...selectedSongs]

      await updateDoc(collectionRef, {
        songs: updatedSongs,
        songCount: updatedSongs.length,
        updatedAt: Timestamp.now(),
      })

      toast.success(`Added ${selectedSongs.length} song(s) to collection`)
      setSelectedSongs([])
      setSearchQuery('')
      setSearchResults([])
      onSongsAdded()
      onClose()
    } catch (error: any) {
      console.error('Error adding songs:', error)
      toast.error('Failed to add songs')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold mb-2">Add Songs to Collection</h2>
                <p className="text-text-secondary text-sm">
                  Search and add songs from YouTube
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search Songs */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Songs
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs on YouTube..."
                    className="w-full px-4 py-2 bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                  />

                  {/* Search Results */}
                  {isSearching && (
                    <div className="text-center py-8 text-text-secondary">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p>Searching...</p>
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((song) => {
                        const isSelected = selectedSongs.some((s) => s.id === song.id)
                        const isExisting = existingSongIds.has(song.id)
                        return (
                          <motion.div
                            key={song.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => !isExisting && toggleSongSelection(song)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                              isExisting
                                ? 'bg-surface-elevated border-border opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary/20 border-primary'
                                : 'bg-surface-elevated border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={song.thumbnail}
                                alt={song.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{song.title}</p>
                              <p className="text-sm text-text-secondary truncate">
                                {song.channel}
                              </p>
                            </div>
                            {isExisting ? (
                              <span className="text-xs text-text-secondary">Already added</span>
                            ) : (
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-primary border-primary'
                                    : 'border-text-secondary'
                                }`}
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {!isSearching && searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      <p>No results found</p>
                    </div>
                  )}
                </div>

                {/* Selected Songs */}
                {selectedSongs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Selected Songs ({selectedSongs.length})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedSongs.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-3 p-2 bg-surface-elevated rounded-lg"
                        >
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={song.thumbnail}
                              alt={song.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{song.title}</p>
                            <p className="text-xs text-text-secondary truncate">
                              {song.channel}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleSongSelection(song)}
                            className="text-text-secondary hover:text-text-primary"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSongs}
                  disabled={selectedSongs.length === 0 || isAdding}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? 'Adding...' : `Add ${selectedSongs.length} Song(s)`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
