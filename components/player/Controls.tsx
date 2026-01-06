'use client'

import { usePlayerStore } from '@/store/playerStore'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import toast from 'react-hot-toast'

export function Controls() {
  const {
    isPlaying,
    togglePlay,
    nextSong,
    previousSong,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
  } = usePlayerStore()

  const repeatStates: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one']
  const currentRepeatIndex = repeatStates.indexOf(repeat)

  const handleRepeat = () => {
    const nextIndex = (currentRepeatIndex + 1) % repeatStates.length
    const nextRepeat = repeatStates[nextIndex]
    setRepeat(nextRepeat)
    toast.success(`Repeat: ${nextRepeat === 'off' ? 'Off' : nextRepeat === 'all' ? 'All' : 'One'}`)
  }

  const handleShuffle = () => {
    const newShuffle = !shuffle
    setShuffle(newShuffle)
    toast.success(`Shuffle: ${newShuffle ? 'On' : 'Off'}`)
  }

  const handlePrevious = () => {
    previousSong()
  }

  const handleNext = () => {
    nextSong()
  }

  return (
    <div className="flex items-center justify-center gap-6 md:gap-8">
      {/* Shuffle Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleShuffle}
        className={cn(
          'p-2.5 rounded-full transition-all duration-200',
          'hover:bg-surface-elevated active:scale-95',
          shuffle
            ? 'text-primary'
            : 'text-text-secondary hover:text-text-primary'
        )}
        aria-label="Shuffle"
        title="Shuffle"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </motion.button>

      {/* Previous Button */}
      <motion.button
        whileHover={{ scale: 1.2, color: "#fff" }}
        whileTap={{ scale: 0.9 }}
        onClick={handlePrevious}
        className="p-2 text-white/70 hover:text-white transition-all duration-200 active:scale-95"
        aria-label="Previous"
        title="Previous"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 6h2v12H6V6zm11 6l-8.5 6V6l8.5 6z" />
        </svg>
      </motion.button>

      {/* Play/Pause Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={togglePlay}
        className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Glow effect - increased opacity */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />

        {/* Button content */}
        <div className="relative z-10 flex items-center justify-center drop-shadow-md">
          {isPlaying ? (
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="w-7 h-7 md:w-8 md:h-8 ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </motion.button>

      {/* Next Button */}
      <motion.button
        whileHover={{ scale: 1.2, color: "#fff" }}
        whileTap={{ scale: 0.9 }}
        onClick={handleNext}
        className="p-2 text-white/70 hover:text-white transition-all duration-200 active:scale-95"
        aria-label="Next"
        title="Next"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </motion.button>

      {/* Repeat Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleRepeat}
        className={cn(
          'relative p-2.5 rounded-full transition-all duration-200',
          'hover:bg-surface-elevated active:scale-95',
          repeat !== 'off'
            ? 'text-primary'
            : 'text-text-secondary hover:text-text-primary'
        )}
        aria-label={`Repeat ${repeat}`}
        title={`Repeat ${repeat === 'off' ? 'Off' : repeat === 'all' ? 'All' : 'One'}`}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
        </svg>
        {repeat === 'one' && (
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold leading-none">
            1
          </span>
        )}
      </motion.button>
    </div>
  )
}