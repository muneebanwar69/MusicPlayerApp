'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, getFirebaseAuth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Sidebar } from '@/components/navigation/Sidebar'
import { BottomNav } from '@/components/navigation/BottomNav'
import { PlayerBar } from '@/components/player/PlayerBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  useKeyboardShortcuts()
  useAnalytics()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const authInstance = auth || getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (!user) {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar />
      <BottomNav />
      <main className="flex-1 md:ml-48 pb-24 md:pb-28 transition-all duration-300 px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        {children}
      </main>
      <PlayerBar />
    </div>
  )
}
