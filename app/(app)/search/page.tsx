'use client'

import { useState, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import { usePlayerStore, Song } from '@/store/playerStore'
import { formatDuration } from '@/lib/utils'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { trackSearch } from '@/lib/analytics'
import { saveSearchQuery } from '@/lib/searchHistory'
import { useUserStore } from '@/store/userStore'
import { PlayIcon } from '@/components/icons/NavIcons'
import { LikeButton } from '@/components/ui/LikeButton'

interface SearchResult {
    id: string
    title: string
    channel: string
    thumbnail: string
    duration: string
}

function SongCard({ song }: { song: SearchResult }) {
    const { playSong, addToQueue, currentSong, isPlaying } = usePlayerStore()
    const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying

    const handlePlay = () => {
        const formattedSong: Song = {
            id: song.id,
            title: song.title,
            channel: song.channel,
            thumbnail: song.thumbnail,
            duration: formatDuration(song.duration),
        }
        playSong(formattedSong)
    }

    const handleAddToQueue = () => {
        const formattedSong: Song = {
            id: song.id,
            title: song.title,
            channel: song.channel,
            thumbnail: song.thumbnail,
            duration: formatDuration(song.duration),
        }
        addToQueue(formattedSong)
        toast.success('Added to queue')
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlay}
            className="bg-surface-elevated backdrop-blur-sm rounded-2xl p-4 hover:bg-surface-elevated/80 dark:hover:bg-surface-elevated border-2 border-border dark:border-white/5 hover:border-primary/30 transition-all duration-200 group cursor-pointer shadow-lg hover:shadow-xl"
        >
            <div className="flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                        src={song.thumbnail}
                        alt={song.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="80px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation()
                            handlePlay()
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center">
                            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                        </div>
                    </motion.button>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate mb-1 text-text-primary dark:text-white group-hover:text-primary transition-colors">{song.title}</h3>
                    <p className="text-sm text-text-secondary dark:text-white/50 truncate mb-2">{song.channel}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleAddToQueue()
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-surface dark:bg-white/5 hover:bg-surface-elevated dark:hover:bg-white/10 border border-border dark:border-white/10 transition-colors text-text-primary dark:text-white"
                        >
                            + Queue
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                            <LikeButton
                                song={{
                                    id: song.id,
                                    title: song.title,
                                    channel: song.channel,
                                    thumbnail: song.thumbnail,
                                    duration: formatDuration(song.duration),
                                }}
                                size="small"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function SearchPage() {
    const { user } = useUserStore()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedQuery = useDebounce(searchQuery, 500)
    const { ref, inView } = useInView()

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async ({ pageParam = '' }) => {
            if (!debouncedQuery) return { results: [], nextPageToken: null }

            const res = await fetch(
                `/api/youtube/search?q=${encodeURIComponent(debouncedQuery)}&pageToken=${pageParam || ''}`
            )
            const data = await res.json()

            if (data.quotaExceeded || res.status === 429) {
                console.warn('YouTube API quota exceeded')
                return { results: [], nextPageToken: null, quotaExceeded: true }
            }

            if (!res.ok) {
                throw new Error(data.message || 'Search failed')
            }

            return data
        },
        enabled: !!debouncedQuery,
        getNextPageParam: (lastPage) => lastPage.nextPageToken,
        initialPageParam: '',
    })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const results = data?.pages.flatMap((page) => page.results) || []
    const quotaExceeded = data?.pages.some((page: any) => page.quotaExceeded) || false

    useEffect(() => {
        if (debouncedQuery && results.length > 0) {
            trackSearch(debouncedQuery, results.length)
            if (user?.uid) {
                saveSearchQuery(user.uid, debouncedQuery).catch(console.error)
            }
        }
    }, [debouncedQuery, results.length, user?.uid])

    return (
        <div className="min-h-screen pb-32">
            {/* Search Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 pt-6"
            >
                <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent dark:from-white dark:to-white/60">
                    Search Music
                </h1>
                <div className="relative max-w-2xl">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for songs, artists, albums..."
                        className="w-full px-6 py-4 pl-14 rounded-2xl bg-surface-elevated backdrop-blur-xl border-2 border-border dark:border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/30 shadow-lg"
                    />
                    <svg
                        className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-text-secondary dark:text-white/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSearchQuery('')
                            }}
                            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-text-secondary dark:text-white/30 hover:text-text-primary dark:hover:text-white/60 transition-colors z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Results Section */}
            {isLoading && debouncedQuery && (
                <div className="space-y-4 max-w-4xl">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-surface-elevated/50 rounded-2xl p-4 animate-pulse"
                        >
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-surface rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-surface rounded w-3/4" />
                                    <div className="h-3 bg-surface rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && debouncedQuery && results.length === 0 && (
                <div className="text-center py-16">
                    {quotaExceeded ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-error/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-text-primary dark:text-white font-semibold">YouTube API Quota Exceeded</p>
                            <p className="text-text-secondary dark:text-white/50 text-sm">Please try again later</p>
                        </motion.div>
                    ) : (
                        <p className="text-text-secondary dark:text-white/50">No results found</p>
                    )}
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-4 max-w-4xl">
                    {results.map((song: SearchResult) => (
                        <SongCard key={song.id} song={song} />
                    ))}
                    <div ref={ref} className="py-4">
                        {isFetchingNextPage && (
                            <div className="text-center text-white/50">Loading more...</div>
                        )}
                    </div>
                </div>
            )}

            {!debouncedQuery && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <div className="text-center py-8">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
                        >
                            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </motion.div>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white/90 mb-2">Discover Music</h2>
                        <p className="text-text-secondary dark:text-white/50">Search for your favorite songs, artists, and more</p>
                    </div>

                    {/* Trending Searches */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-4xl"
                    >
                        <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔥</span> Trending Searches
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {['Arijit Singh', 'Diljit Dosanjh', 'AP Dhillon', 'Sidhu Moose Wala', 'Pritam', 'Taylor Swift', 'The Weeknd', 'Dua Lipa'].map((term, i) => (
                                <motion.button
                                    key={term}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSearchQuery(term)}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 rounded-full bg-surface-elevated border border-border hover:border-primary/50 text-text-primary dark:text-white/80 font-medium transition-all shadow-sm hover:shadow-md"
                                >
                                    {term}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Browse by Genre */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-4xl"
                    >
                        <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🎵</span> Browse by Genre
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'Bollywood Hits', emoji: '🎬', gradient: 'from-pink-500 to-rose-500', query: 'Bollywood hits 2024' },
                                { name: 'Punjabi Beats', emoji: '🎤', gradient: 'from-orange-500 to-amber-500', query: 'Punjabi songs latest' },
                                { name: 'Pop Music', emoji: '✨', gradient: 'from-violet-500 to-purple-500', query: 'Pop music hits' },
                                { name: 'Hip Hop', emoji: '🎧', gradient: 'from-emerald-500 to-teal-500', query: 'Hip hop trending' },
                                { name: 'Romantic', emoji: '❤️', gradient: 'from-red-500 to-pink-500', query: 'Romantic songs Hindi' },
                                { name: 'Party Mix', emoji: '🎉', gradient: 'from-yellow-500 to-orange-500', query: 'Party songs dance' },
                                { name: 'Lo-Fi Chill', emoji: '🌙', gradient: 'from-indigo-500 to-blue-500', query: 'Lofi chill beats' },
                                { name: 'Workout', emoji: '💪', gradient: 'from-green-500 to-emerald-500', query: 'Workout gym music' },
                            ].map((genre, i) => (
                                <motion.button
                                    key={genre.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.05 }}
                                    onClick={() => setSearchQuery(genre.query)}
                                    whileHover={{ scale: 1.03, y: -4 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`relative p-6 rounded-2xl bg-gradient-to-br ${genre.gradient} text-white font-semibold overflow-hidden shadow-lg hover:shadow-xl transition-all`}
                                >
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <span className="text-3xl">{genre.emoji}</span>
                                        <span className="text-sm">{genre.name}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-4xl bg-surface-elevated/50 rounded-2xl p-6 border border-border"
                    >
                        <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                            <span className="text-2xl">💡</span> Quick Tips
                        </h3>
                        <ul className="space-y-2 text-text-secondary dark:text-white/60 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Search by song name, artist, or album
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                Click on any song to start playing instantly
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                Add songs to queue or like them for later
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}
