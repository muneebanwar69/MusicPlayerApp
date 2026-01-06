'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { usePlayerStore } from '@/store/playerStore'

interface RotatingDiscProps {
  size?: number
}

export function RotatingDisc({ size = 200 }: RotatingDiscProps) {
  const { currentSong, isPlaying } = usePlayerStore()

  if (!currentSong) {
    return (
      <div
        className="relative rounded-full bg-surface-elevated flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-4xl">🎵</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Vinyl background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-black shadow-2xl" />

      {/* Rotating disc */}
      <motion.div
        className="absolute inset-4 rounded-full overflow-hidden"
        animate={isPlaying ? { rotate: 360 } : {}}
        transition={{
          duration: 8,
          repeat: isPlaying ? Infinity : 0,
          ease: 'linear',
        }}
        style={{
          transformOrigin: 'center center',
        }}
      >
        <Image
          src={currentSong.thumbnail}
          alt={currentSong.title}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </motion.div>

      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 border-4 border-gray-700" />
    </div>
  )
}
