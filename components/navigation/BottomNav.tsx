'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HomeIcon, SearchIcon, LibraryIcon, DJIcon, ProfileIcon } from '@/components/icons/NavIcons'
import { useThemeStore } from '@/store/themeStore'

const navItems = [
  { name: 'Home', href: '/', Icon: HomeIcon },
  { name: 'Search', href: '/search', Icon: SearchIcon },
  { name: 'Library', href: '/library', Icon: LibraryIcon },
  { name: 'DJ', href: '/dj', Icon: DJIcon },
  { name: 'Profile', href: '/profile', Icon: ProfileIcon },
]

export function BottomNav() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useThemeStore()

  return (
    <>
      {/* Mobile Theme Toggle - Floating Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg flex items-center justify-center"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {theme === 'light' ? (
            <motion.svg
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border z-50 shadow-2xl">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.Icon
            return (
              <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center relative">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    'flex flex-col items-center gap-1 relative z-10 transition-all duration-200',
                    isActive ? 'text-primary' : 'text-text-secondary'
                  )}
                >
                  <motion.div
                    animate={isActive ? { scale: 1.2, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={cn(
                      'p-2 rounded-xl transition-all duration-200',
                      isActive ? 'bg-primary/20' : ''
                    )}
                  >
                    <Icon className="w-5 h-5" isActive={isActive} />
                  </motion.div>
                  <motion.span
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.7, scale: 0.9 }}
                    className="text-xs font-medium"
                  >
                    {item.name}
                  </motion.span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
