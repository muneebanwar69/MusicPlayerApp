'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setShowInstallButton(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showInstallButton) return null

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-24 md:w-80 z-50"
        >
          <div className="bg-gradient-to-br from-primary/90 to-secondary/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  <path d="M14.5 8.5 L14.5 15.5 L18 12 Z" fill="currentColor"/>
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">Install MusicFlow</h3>
                <p className="text-white/70 text-xs mt-0.5">
                  Add to home screen for the best experience
                </p>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-white text-primary font-medium text-sm py-2 px-4 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 text-white/70 hover:text-white text-sm transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// iOS Install Instructions (since iOS doesn't support beforeinstallprompt)
export function IOSInstallPrompt() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)
    
    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (navigator as any).standalone === true
    setIsStandalone(standalone)

    // Check if dismissed
    const dismissed = localStorage.getItem('ios-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    if (iOS && !standalone) {
      setTimeout(() => setShowIOSPrompt(true), 3000)
    }
  }, [])

  const handleDismiss = () => {
    setShowIOSPrompt(false)
    localStorage.setItem('ios-install-dismissed', Date.now().toString())
  }

  if (!isIOS || isStandalone || !showIOSPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-gradient-to-br from-primary/90 to-secondary/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <path d="M14.5 8.5 L14.5 15.5 L18 12 Z" fill="currentColor"/>
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Install MusicFlow</h3>
              <p className="text-white/70 text-xs mt-1 leading-relaxed">
                Tap <span className="inline-flex items-center mx-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span> then <strong>&quot;Add to Home Screen&quot;</strong>
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
