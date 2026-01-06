import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

/**
 * Hook to automatically track page views
 * Use this in your layout or page components
 */
export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])
}
