"use client"

import { Button } from "@workspace/ui/components/button"
import Header from "../components/header"
import { useEffect, useState } from "react"
import { validateSessionWithCredentials } from "../lib/actions"

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<{
    valid: boolean
    userId?: string
    message?: string
  } | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Check session status when component mounts
    const checkSession = async () => {
      try {
        // Get session credentials from localStorage (client-side only)
        const sessionId = localStorage.getItem('sessionId')
        const accessToken = localStorage.getItem('accessToken')
        
        if (!sessionId && !accessToken) {
          console.log('❌ No session credentials found in localStorage')
          setSessionStatus({ valid: false, message: 'No session found' })
          return
        }
        
        // Validate session with server
        const result = await validateSessionWithCredentials(sessionId || undefined, accessToken || undefined)
        setSessionStatus(result)
      } catch (error) {
        console.error('Error checking session:', error)
        setSessionStatus({ valid: false, message: 'Error checking session' })
      } finally {
        setCheckingSession(false)
      }
    }
    
    checkSession()
  }, [])

  if (!mounted) {
    return (
      <div>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-center">Welcome to DO Study</h1>
            <p className="text-lg text-muted-foreground text-center max-w-2xl">
              Your comprehensive learning management system for professional development and certification.
            </p>
            <div className="flex gap-4 mt-6">
              <Button size="lg">Browse Courses</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Session Status Display */}
          {checkingSession ? (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">🔍 Checking session status...</p>
            </div>
          ) : sessionStatus?.valid ? (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">✅ Hi you are now logged in</p>
              {sessionStatus.userId && (
                <p className="text-green-600 text-sm mt-1">User ID: {sessionStatus.userId}</p>
              )}
            </div>
          ) : (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700">👋 Welcome! Please sign in to access your account.</p>
              {sessionStatus?.message && (
                <p className="text-gray-600 text-sm mt-1">Status: {sessionStatus.message}</p>
              )}
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-center">Welcome to DO Study</h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl">
            Your comprehensive learning management system for professional development and certification.
          </p>
          <div className="flex gap-4 mt-6">
            <Button size="lg">Browse Courses</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
