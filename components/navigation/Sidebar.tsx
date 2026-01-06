'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { auth, getFirebaseAuth } from '@/lib/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { HomeIcon, SearchIcon, LibraryIcon, DJIcon } from '@/components/icons/NavIcons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navItems = [
  { name: 'Home', href: '/', Icon: HomeIcon },
  { name: 'Search', href: '/search', Icon: SearchIcon },
  { name: 'Your Library', href: '/library', Icon: LibraryIcon },
  { name: 'DJ', href: '/dj', Icon: DJIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, displayName, photoURL, setUser } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const authInstance = auth || getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [setUser])

  const handleLogout = async () => {
    try {
      const authInstance = auth || getFirebaseAuth()
      await signOut(authInstance)
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-48 h-screen glass border-r border-border p-4 fixed left-0 top-0 z-40 bg-surface/95 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 px-2"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-500" />
            <img
              src="/assets/musicflow-logo.svg"
              alt="MusicFlow Logo"
              className="w-8 h-8 relative z-10 transform group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
            MusicFlow
          </span>
        </Link>
      </motion.div>

      {/* Theme Toggle */}
      <div className="mb-6 flex justify-center">
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.Icon
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group',
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-l-4 border-primary'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                )}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100",
                  isActive ? "bg-primary/20 opacity-100 shadow-[0_0_20px_rgba(29,185,84,0.3)]" : "bg-primary/5"
                )} />

                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="relative z-10"
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary")} isActive={isActive} />
                </motion.div>

                <span className={cn(
                  "text-sm font-medium relative z-10 transition-colors duration-200",
                  isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary"
                )}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
      {/* User Profile */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-auto pt-6 border-t border-border"
        >
          <Link href="/profile">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 rounded-xl glass-panel hover:bg-surface-elevated transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-md rounded-full group-hover:bg-primary/50 transition-all" />
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName || 'User'}
                      className="w-8 h-8 rounded-full relative z-10 border-2 border-primary/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative z-10 border-2 border-primary/50">
                      <span className="text-xs font-bold text-white dark:text-white">
                        {displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-text-primary">
                    {displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-text-secondary truncate">Profile</p>
                </div>
              </div>
            </motion.div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-surface-elevated hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors text-sm mt-3"
          >
            Sign Out
          </button>
        </motion.div>
      )}
    </aside>
  )
}
