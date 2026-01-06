import { create } from 'zustand'
import { User } from 'firebase/auth'

interface UserState {
  user: User | null
  displayName: string | null
  photoURL: string | null
  
  setUser: (user: User | null) => void
  setDisplayName: (name: string | null) => void
  setPhotoURL: (url: string | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  displayName: null,
  photoURL: null,
  
  setUser: (user) => set({ 
    user, 
    displayName: user?.displayName || null,
    photoURL: user?.photoURL || null 
  }),
  setDisplayName: (displayName) => set({ displayName }),
  setPhotoURL: (photoURL) => set({ photoURL }),
}))
