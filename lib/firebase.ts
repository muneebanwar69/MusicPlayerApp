import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC85GTA0wK6ZE-Rbzs68cMwoR9KQ694ypA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "musicplayerapp-ace2c.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "musicplayerapp-ace2c",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "musicplayerapp-ace2c.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "391586971376",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:391586971376:web:814ee2e46b3178ca0ecc35",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VVX731E5XY",
}

// Initialize Firebase app
let app: FirebaseApp
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize services - ensure they're available on client side
let auth: Auth | undefined
let db: Firestore | undefined
let analytics: Analytics | null = null

// Function to get auth - ensures it's initialized
export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be used on the client side')
  }
  if (!auth) {
    auth = getAuth(app)
  }
  return auth
}

// Function to get firestore
export function getFirebaseFirestore(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be used on the client side')
  }
  if (!db) {
    db = getFirestore(app)
  }
  return db
}

// Initialize on client side
if (typeof window !== 'undefined') {
  try {
    auth = getAuth(app)
    db = getFirestore(app)
    
    // Initialize Analytics
    isSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app)
      }
    }).catch(() => {
      analytics = null
    })
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

export { auth, db, analytics }
export default app
