'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { likeSong, unlikeSong, isSongLiked } from '@/lib/likedSongs'
import { Song } from '@/store/playerStore'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  song: Song
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function LikeButton({ song, size = 'medium', className = '' }: LikeButtonProps) {
  const { user } = useUserStore()
  const [liked, setLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
  }

  // Check if song is liked on mount
  useEffect(() => {
    if (!user?.uid || !song.id) {
      setIsChecking(false)
      return
    }

    const checkLiked = async () => {
      try {
        const isLiked = await isSongLiked(user.uid, song.id)
        setLiked(isLiked)
      } catch (error) {
        console.error('Error checking like status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkLiked()
  }, [user?.uid, song.id])

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user?.uid) {
      toast.error('Please log in to like songs')
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      if (liked) {
        await unlikeSong(user.uid, song.id)
        setLiked(false)
        toast.success('Removed from liked songs')
        // Trigger event to refresh liked songs list
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('likedSongsChanged'))
        }
      } else {
        await likeSong(user.uid, song)
        setLiked(true)
        toast.success('Added to liked songs')
        // Trigger event to refresh liked songs list
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('likedSongsChanged'))
        }
      }
    } catch (error: any) {
      console.error('Error toggling like:', error)
      
      // Show more specific error messages
      if (error?.code === 'permission-denied') {
        toast.error('Permission denied. Please check Firestore rules.')
      } else if (error?.code === 'unauthenticated') {
        toast.error('Please log in to like songs')
      } else if (error?.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to update like status. Check console for details.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full rounded-full bg-surface-elevated animate-pulse" />
      </div>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggleLike}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]} 
        ${className}
        flex items-center justify-center
        rounded-full
        transition-colors
        ${liked 
          ? 'text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20' 
          : 'text-text-secondary hover:text-red-500 bg-surface-elevated hover:bg-red-500/10'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={liked ? 'Unlike song' : 'Like song'}
    >
      <motion.svg
        className="w-full h-full"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        animate={liked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </motion.svg>
    </motion.button>
  )
}
