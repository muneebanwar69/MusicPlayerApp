'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, getFirebaseAuth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Sidebar } from '@/components/navigation/Sidebar'
import { BottomNav } from '@/components/navigation/BottomNav'
import { PlayerBar } from '@/components/player/PlayerBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { InstallPrompt, IOSInstallPrompt } from '@/components/pwa/InstallPrompt'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useKeyboardShortcuts()
  useAnalytics()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const authInstance = auth || getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (!user) {
        // Not authenticated - redirect to login
        router.replace('/login')
      } else {
        // Authenticated - allow rendering
        setIsAuthenticated(true)
      }
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [router])

  // Show loading screen while checking authentication
  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl animate-pulse">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <path d="M14.5 8.5 L14.5 15.5 L18 12 Z" fill="currentColor"/>
            </svg>
          </div>
          {/* Loading spinner */}
          <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-text-secondary text-sm">Loading MusicFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ServiceWorkerRegistration />
      <Sidebar />
      <BottomNav />
      <main className="flex-1 md:ml-48 pb-24 md:pb-28 transition-all duration-300 px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
        {children}
      </main>
      <PlayerBar />
      <InstallPrompt />
      <IOSInstallPrompt />
    </div>
  )
}
