'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { Song } from '@/store/playerStore'
import Image from 'next/image'

interface CreateCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCollectionCreated: () => void
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onCollectionCreated,
}: CreateCollectionModalProps) {
  const { user } = useUserStore()
  const [collectionName, setCollectionName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) {
      toast.error('Please enter a collection name')
      return
    }

    if (!user?.uid) {
      toast.error('You must be logged in')
      return
    }

    setIsCreating(true)
    try {
      if (!db) {
        throw new Error('Firestore not initialized')
      }
      const collectionRef = collection(db, 'collections')
      await addDoc(collectionRef, {
        name: collectionName.trim(),
        userId: user.uid,
        songs: [],
        songCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      toast.success('Collection created successfully!')
      setCollectionName('')
      onCollectionCreated()
      onClose()
    } catch (error: any) {
      console.error('Error creating collection:', error)
      toast.error('Failed to create collection')
    } finally {
      setIsCreating(false)
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
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-bold mb-2">Create New Collection</h2>
                <p className="text-text-secondary text-sm">
                  Give your collection a name
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Collection Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="My Favorite Songs"
                    className="w-full px-4 py-2 bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
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
                  onClick={handleCreateCollection}
                  disabled={!collectionName.trim() || isCreating}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
