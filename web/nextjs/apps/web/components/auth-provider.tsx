'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  userId: string
  username?: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  sessionValid: boolean
  showSuccessMessage: boolean
  setShowSuccessMessage: (show: boolean) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionValid, setSessionValid] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check existing session on mount
    const checkSession = async () => {
      const sessionId = localStorage.getItem('sessionId')
      const accessToken = localStorage.getItem('accessToken')
      const userID = localStorage.getItem('userID')

      if (sessionId && accessToken && userID) {
        console.log('🔍 Found session credentials, validating...')
        
        try {
          // Import validateSession dynamically to avoid SSR issues
          const { validateSession } = await import('@/lib/actions')
          const validation = await validateSession(sessionId, accessToken)
          
          if (validation.valid) {
            console.log('✅ Session valid, setting user state')
            setSessionValid(true)
            setUser({ userId: validation.userId })
          } else {
            console.log('❌ Session invalid, clearing credentials')
            localStorage.removeItem('sessionId')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('userID')
          }
        } catch (error) {
          console.error('❌ Session validation error:', error)
        }
      } else {
        console.log('❌ No session credentials found in localStorage')
      }
    }

    // Listen for real-time authentication success events
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log('🎉 Received authSuccess event globally:', event.detail)
      setShowSuccessMessage(true)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
      
      // Update user state immediately with new session data
      if (event.detail.userID) {
        setUser(prev => ({
          ...prev,
          userId: event.detail.userID
        }))
        setSessionValid(true)
      }
    }

    // Add event listener for authentication success
    window.addEventListener('authSuccess', handleAuthSuccess as EventListener)

    // Check session on mount
    checkSession()

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('authSuccess', handleAuthSuccess as EventListener)
    }
  }, [])

  const signOut = () => {
    localStorage.removeItem('sessionId')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userID')
    setUser(null)
    setSessionValid(false)
    setShowSuccessMessage(false)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionValid,
        showSuccessMessage,
        setShowSuccessMessage,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
