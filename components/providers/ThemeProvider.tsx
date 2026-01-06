'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme)
    const [mounted, setMounted] = useState(false)

    // Set dark mode immediately on first render (before hydration)
    useEffect(() => {
        const root = window.document.documentElement
        // Check if theme is stored, if not default to dark
        const storedTheme = localStorage.getItem('theme-storage')
        if (!storedTheme) {
            root.classList.remove('light', 'dark')
            root.classList.add('dark')
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(theme)
    }, [theme, mounted])

    return <>{children}</>
}
