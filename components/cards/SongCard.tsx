'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { usePlayerStore, Song } from '@/store/playerStore'
import { truncateText } from '@/lib/utils'

interface SongCardProps {
  song: Song
  size?: 'small' | 'medium' | 'large'
  showPlayButton?: boolean
}

export function SongCard({ song, size = 'medium', showPlayButton = true }: SongCardProps) {
  const { playSong } = usePlayerStore()

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  }

  const handlePlay = () => {
    playSong(song)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handlePlay}
      className="cursor-pointer group"
    >
      <div className={`${sizeClasses[size]} relative rounded-lg overflow-hidden bg-surface-elevated mb-2`}>
        <Image
          src={song.thumbnail}
          alt={song.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform"
          sizes={`${size === 'small' ? '128px' : size === 'medium' ? '192px' : '256px'}`}
        />
        {showPlayButton && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
            >
              <svg
                className="w-6 h-6 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84z" />
              </svg>
            </motion.div>
          </div>
        )}
      </div>
      <p className="font-medium text-sm truncate">{truncateText(song.title, 30)}</p>
      <p className="text-xs text-text-secondary truncate">
        {truncateText(song.channel, 30)}
      </p>
    </motion.div>
  )
}
