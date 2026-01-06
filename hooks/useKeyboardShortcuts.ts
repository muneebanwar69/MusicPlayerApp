import { useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import toast from 'react-hot-toast'

export function useKeyboardShortcuts() {
  const {
    togglePlay,
    nextSong,
    previousSong,
    setVolume,
    volume,
    currentSong,
  } = usePlayerStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            previousSong()
          } else {
            // Seek backward 10 seconds
            const audio = usePlayerStore.getState().audioElement
            if (audio) {
              audio.currentTime = Math.max(0, audio.currentTime - 10)
            }
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            nextSong()
          } else {
            // Seek forward 10 seconds
            const audio = usePlayerStore.getState().audioElement
            if (audio) {
              audio.currentTime = Math.min(
                audio.duration,
                audio.currentTime + 10
              )
            }
          }
          break
        case 'm':
        case 'M':
          e.preventDefault()
          const newVolume = volume > 0 ? 0 : 0.7
          setVolume(newVolume)
          toast.success(newVolume > 0 ? 'Unmuted' : 'Muted')
          break
        case 'l':
        case 'L':
          e.preventDefault()
          if (currentSong) {
            // Toggle like functionality
            toast.success('Song liked!')
          }
          break
        case 'n':
        case 'N':
          if (e.shiftKey) {
            e.preventDefault()
            nextSong()
          }
          break
        case 'p':
        case 'P':
          if (e.shiftKey) {
            e.preventDefault()
            previousSong()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, nextSong, previousSong, setVolume, volume, currentSong])
}
