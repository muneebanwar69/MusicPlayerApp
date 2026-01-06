'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { usePlayerStore } from '@/store/playerStore'

interface AudioVisualizerProps {
  size?: number
  barCount?: number
  className?: string
}

export function AudioVisualizer({ size = 320, barCount = 60, className = '' }: AudioVisualizerProps) {
  const { isPlaying, currentSong } = usePlayerStore()
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0.3))
  const animationRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Generate random bar heights that simulate music visualization
  useEffect(() => {
    if (!isPlaying) {
      // When not playing, set all bars to minimal height with slight variation
      setBars(Array(barCount).fill(0).map(() => 0.1 + Math.random() * 0.1))
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const animate = (timestamp: number) => {
      // Throttle updates to ~30fps for performance
      if (timestamp - lastUpdateRef.current < 33) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastUpdateRef.current = timestamp

      setBars(prevBars => {
        return prevBars.map((bar, i) => {
          // Create wave-like patterns with some randomness
          const wave = Math.sin((timestamp / 200) + (i * 0.3)) * 0.3
          const random = Math.random() * 0.4
          const bass = i < barCount / 4 ? Math.random() * 0.3 : 0 // More bass on left side
          const treble = i > barCount * 0.75 ? Math.random() * 0.2 : 0 // More treble on right
          
          const newValue = 0.2 + wave + random + bass + treble
          
          // Smooth transition
          return bar + (newValue - bar) * 0.3
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, barCount])

  const radius = size / 2 - 20 // Leave some padding
  const centerX = size / 2
  const centerY = size / 2

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={isPlaying ? {
          boxShadow: [
            '0 0 30px rgba(29, 185, 84, 0.3)',
            '0 0 60px rgba(29, 185, 84, 0.5)',
            '0 0 30px rgba(29, 185, 84, 0.3)',
          ],
        } : {
          boxShadow: '0 0 20px rgba(29, 185, 84, 0.1)',
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Main visualizer SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 10}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border dark:text-white/10"
        />

        {/* Audio bars arranged in a circle */}
        {bars.map((height, index) => {
          const angle = (index / barCount) * 2 * Math.PI - Math.PI / 2
          const innerRadius = radius - 30
          const barLength = 20 + height * 40 // Bar length based on "volume"
          
          const x1 = centerX + Math.cos(angle) * innerRadius
          const y1 = centerY + Math.sin(angle) * innerRadius
          const x2 = centerX + Math.cos(angle) * (innerRadius + barLength)
          const y2 = centerY + Math.sin(angle) * (innerRadius + barLength)

          // Color based on position (creates gradient effect around circle)
          const hue = (index / barCount) * 60 + 140 // Green to cyan range
          const saturation = 70 + height * 30
          const lightness = 45 + height * 15

          return (
            <motion.line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isPlaying ? `hsl(${hue}, ${saturation}%, ${lightness}%)` : 'rgba(100, 100, 100, 0.3)'}
              strokeWidth={isPlaying ? 3 : 2}
              strokeLinecap="round"
              initial={false}
              animate={{
                x2,
                y2,
                opacity: isPlaying ? 0.8 + height * 0.2 : 0.3,
              }}
              transition={{ duration: 0.1 }}
            />
          )
        })}

        {/* Inner circle with gradient */}
        <defs>
          <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 50}
          fill="url(#innerGradient)"
          className={isPlaying ? 'animate-pulse' : ''}
        />
      </svg>

      {/* Center content slot */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          width: (radius - 50) * 2,
          height: (radius - 50) * 2,
          left: centerX - (radius - 50),
          top: centerY - (radius - 50),
        }}
      >
        {/* This area can be used for album art or play button */}
      </div>

      {/* Pulsing rings when playing */}
      {isPlaying && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-secondary/30"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}
    </div>
  )
}
