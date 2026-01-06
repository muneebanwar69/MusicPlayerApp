import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(duration: string | number | undefined | null): number {
  if (duration === undefined || duration === null) return 0
  
  // If it's already a number (ytmusic-api returns seconds as number)
  if (typeof duration === 'number') {
    return isNaN(duration) ? 0 : Math.floor(duration)
  }
  
  // If it's a string that's just a number
  if (typeof duration === 'string' && /^\d+$/.test(duration)) {
    return parseInt(duration, 10)
  }
  
  // If it's ISO 8601 format (YouTube Data API format like "PT3M30S")
  if (typeof duration === 'string') {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return 0
    
    const hours = (match[1] || '').replace('H', '') || '0'
    const minutes = (match[2] || '').replace('M', '') || '0'
    const seconds = (match[3] || '').replace('S', '') || '0'
    
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
  }
  
  return 0
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
