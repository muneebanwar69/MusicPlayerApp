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

export function formatDuration(duration: string | undefined): number {
  if (!duration) return 0
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return 0
  
  const hours = (match[1] || '').replace('H', '') || '0'
  const minutes = (match[2] || '').replace('M', '') || '0'
  const seconds = (match[3] || '').replace('S', '') || '0'
  
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
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
