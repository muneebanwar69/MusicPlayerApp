'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CollectionCardProps {
  id: string
  name: string
  songCount: number
  gradient?: string
  thumbnail?: string
}

export function CollectionCard({
  id,
  name,
  songCount,
  gradient = 'from-primary/20 to-secondary/20',
  thumbnail,
}: CollectionCardProps) {
  return (
    <Link href={`/collection/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'h-48 rounded-lg p-6 flex flex-col justify-end cursor-pointer border border-border hover:border-primary/50 transition-colors',
          thumbnail ? 'bg-cover bg-center' : `bg-gradient-to-br ${gradient}`
        )}
        style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined}
      >
        <div className={thumbnail ? 'bg-black/50 rounded-lg p-4 -m-4' : ''}>
          <h3 className="text-xl font-bold mb-1">{name}</h3>
          <p className="text-sm text-text-secondary">{songCount} songs</p>
        </div>
      </motion.div>
    </Link>
  )
}
