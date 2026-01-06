'use client'

import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, getFirebaseAuth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { fadeIn, scaleIn } from '@/lib/animations'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Ensure auth is available
  useEffect(() => {
    if (typeof window !== 'undefined' && !auth) {
      getFirebaseAuth()
    }
  }, [])

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const authInstance = auth || getFirebaseAuth()
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password)
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      toast.success('Account created successfully!')
      router.push('/')
    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? 'This email is already registered. Please sign in instead.'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak. Please use a stronger password.'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address. Please check and try again.'
        : error.message || 'Failed to create account'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-surface to-background relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating particles effect */}
      {typeof window !== 'undefined' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full opacity-20"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
                x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="glass rounded-3xl p-8 md:p-10 shadow-2xl border border-white/10 backdrop-blur-xl"
        >
          <motion.div variants={fadeIn} className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <span className="text-3xl">🎵</span>
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              MusicFlow
            </h1>
            <p className="text-text-secondary text-lg">Create your account</p>
          </motion.div>

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <motion.div variants={fadeIn}>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-text-primary">
                Display Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border-2 border-border focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary"
                placeholder="Your name"
              />
            </motion.div>

            <motion.div variants={fadeIn}>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-text-primary">
                Email
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface border-2 border-border focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary"
                placeholder="you@example.com"
              />
            </motion.div>

            <motion.div variants={fadeIn}>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-text-primary">
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-surface border-2 border-border focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeIn}>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-text-primary">
                Confirm Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-surface border-2 border-border focus:border-primary focus:outline-none transition-all duration-200 text-text-primary placeholder:text-text-secondary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeIn}>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: loading ? '100%' : '-100%' }}
                  transition={{ repeat: loading ? Infinity : 0, duration: 1.5 }}
                />
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={fadeIn} className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1 group"
            >
              Already have an account?
              <span className="group-hover:translate-x-1 transition-transform inline-block">Sign in</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
