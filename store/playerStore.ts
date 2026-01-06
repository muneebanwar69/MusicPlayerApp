import { create } from 'zustand'

export interface Song {
  id: string
  title: string
  channel: string
  thumbnail: string
  duration: number
  durationString?: string
  addedAt?: number
}

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  queue: Song[]
  volume: number
  repeat: 'off' | 'all' | 'one'
  shuffle: boolean
  progress: number
  currentTime: number
  audioElement: HTMLAudioElement | null
  youtubePlayer: any | null
  
  // Actions
  setCurrentSong: (song: Song | null) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setRepeat: (repeat: 'off' | 'all' | 'one') => void
  setShuffle: (shuffle: boolean) => void
  setProgress: (progress: number) => void
  setCurrentTime: (time: number) => void
  setAudioElement: (element: HTMLAudioElement | null) => void
  setYouTubePlayer: (player: any | null) => void
  addToQueue: (song: Song) => void
  removeFromQueue: (songId: string) => void
  clearQueue: () => void
  nextSong: () => void
  previousSong: () => void
  playSong: (song: Song) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 0.7,
  repeat: 'off',
  shuffle: false,
  progress: 0,
  currentTime: 0,
  audioElement: null,
  youtubePlayer: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  togglePlay: () => {
    const { youtubePlayer, isPlaying, currentSong } = get()
    
    // If no song is loaded, do nothing
    if (!currentSong) {
      console.log('No song loaded')
      return
    }
    
    // Update state first - this triggers the YouTubePlayer to react
    const newPlayingState = !isPlaying
    set({ isPlaying: newPlayingState })
    
    // Then try to control the player if it exists
    if (youtubePlayer) {
      try {
        if (newPlayingState) {
          youtubePlayer.playVideo()
        } else {
          youtubePlayer.pauseVideo()
        }
      } catch (error) {
        console.error('Toggle play failed:', error)
        // Player might not be ready, but state is set, so YouTubePlayer will handle it
      }
    } else {
      console.log('YouTube player not ready yet, state updated to:', newPlayingState)
    }
  },
  setPlaying: (playing) => {
    set({ isPlaying: playing })
    const { youtubePlayer } = get()
    if (youtubePlayer) {
      try {
        if (playing) {
          youtubePlayer.playVideo()
        } else {
          youtubePlayer.pauseVideo()
        }
      } catch (error) {
        console.error('Set playing failed:', error)
      }
    }
  },
  setVolume: (volume) => {
    set({ volume })
    const { youtubePlayer } = get()
    if (youtubePlayer) {
      try {
        youtubePlayer.setVolume(volume * 100)
      } catch (error) {
        console.error('Set volume failed:', error)
      }
    }
    const { audioElement } = get()
    if (audioElement) {
      audioElement.volume = volume
    }
  },
  setRepeat: (repeat) => set({ repeat }),
  setShuffle: (shuffle) => set({ shuffle }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setAudioElement: (element) => set({ audioElement: element }),
  setYouTubePlayer: (player) => set({ youtubePlayer: player }),
  addToQueue: (song) =>
    set((state) => ({ queue: [...state.queue, song] })),
  removeFromQueue: (songId) =>
    set((state) => ({
      queue: state.queue.filter((s) => s.id !== songId),
    })),
  clearQueue: () => set({ queue: [] }),
  nextSong: () => {
    const { queue, currentSong, shuffle, repeat } = get()
    if (!currentSong || queue.length === 0) return

    if (repeat === 'one') {
      const { youtubePlayer } = get()
      if (youtubePlayer) {
        try {
          youtubePlayer.seekTo(0, true)
          youtubePlayer.playVideo()
        } catch (error) {
          console.error('Repeat one failed:', error)
        }
      }
      return
    }

    let nextIndex = 0
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      const currentIndex = queue.findIndex((s) => s.id === currentSong.id)
      nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0
        } else {
          return
        }
      }
    }

    const nextSong = queue[nextIndex]
    get().playSong(nextSong)
  },
  previousSong: () => {
    const { queue, currentSong } = get()
    if (!currentSong || queue.length === 0) return

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id)
    const prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      const { youtubePlayer } = get()
      if (youtubePlayer) {
        try {
          youtubePlayer.seekTo(0, true)
        } catch (error) {
          console.error('Seek to start failed:', error)
        }
      }
      return
    }

    const prevSong = queue[prevIndex]
    get().playSong(prevSong)
  },
  playSong: (song) => {
    // Set song and auto-play - isPlaying: true tells YouTubePlayer to start playing when ready
    set({ currentSong: song, isPlaying: true })
    // Play history is saved in YouTubePlayer component when playback actually starts
    // YouTube player will handle actual playback via YouTubePlayer component
  },
}))
