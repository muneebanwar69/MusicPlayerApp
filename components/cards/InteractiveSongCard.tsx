'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { usePlayerStore, Song } from '@/store/playerStore'
import { PlayIcon } from '@/components/icons/NavIcons'
import { LikeButton } from '@/components/ui/LikeButton'
import { useState } from 'react'

interface InteractiveSongCardProps {
  song: Song
  size?: 'small' | 'medium' | 'large'
  onPlay?: (song: Song) => void
}

// Truncate text to specified length
const truncateTitle = (text: string, maxLength: number = 15) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function InteractiveSongCard({ song, size = 'medium', onPlay }: InteractiveSongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const [isHovered, setIsHovered] = useState(false)
  const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onPlay) {
      onPlay(song)
    } else {
      playSong(song)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePlay}
      className="cursor-pointer group relative"
    >
      <div className={`${sizeClasses[size]} relative rounded-[28px] overflow-hidden bg-surface-elevated mb-3 shadow-md group-hover:shadow-xl transition-all duration-300 border border-border`}>
        <Image
          src={song.thumbnail}
          alt={song.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes={`${size === 'small' ? '128px' : size === 'medium' ? '192px' : '256px'}`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button - always visible but more prominent on hover */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            opacity: isHovered || isCurrentlyPlaying ? 1 : 0.7,
            scale: isHovered || isCurrentlyPlaying ? 1 : 0.9,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={handlePlay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              ${isCurrentlyPlaying
                ? 'w-16 h-16 bg-primary shadow-lg shadow-primary/50'
                : 'w-14 h-14 bg-surface/90 dark:bg-white/90 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/50'
              } 
              rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm
            `}
          >
            {isCurrentlyPlaying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            ) : (
              <PlayIcon className="w-6 h-6 text-text-primary dark:text-gray-900 group-hover:text-white ml-0.5 transition-colors" />
            )}
          </motion.button>
        </motion.div>

        {/* Pulse effect when playing */}
        {isCurrentlyPlaying && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-primary"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Like button - top right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <LikeButton song={song} size="small" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors flex-1" title={song.title}>
            {truncateTitle(song.title, 15)}
          </p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <LikeButton song={song} size="small" />
          </div>
        </div>
        <p className="text-xs text-text-secondary" title={song.channel}>
          {truncateTitle(song.channel, 15)}
        </p>
      </div>
    </motion.div>
  )
}
