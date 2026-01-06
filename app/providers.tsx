'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - reduces API calls
            gcTime: 10 * 60 * 1000, // 10 minutes cache time
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on component mount if data exists
            refetchOnReconnect: false,
            retry: 1, // Only retry once on failure
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #262626',
          },
        }}
      />
    </QueryClientProvider>
  )
}
