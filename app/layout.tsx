import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MusicFlow - Premium Audio',
  description: 'Immersive music streaming experience',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
}

// Script to set theme before page renders to prevent flash
const themeScript = `
  (function() {
    try {
      const stored = localStorage.getItem('theme-storage');
      const theme = stored ? JSON.parse(stored).state.theme : 'dark';
      document.documentElement.classList.add(theme);
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-accent/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
        </div>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
