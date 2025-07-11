'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateSession } from '@/lib/actions'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{
    userId: string
    username?: string
    displayName?: string
  } | null>(null)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get session information from localStorage
        const sessionId = localStorage.getItem('sessionId')
        const accessToken = localStorage.getItem('accessToken')
        const userId = localStorage.getItem('userId')
        const username = localStorage.getItem('username')
        const displayName = localStorage.getItem('displayName')

        if (!sessionId && !accessToken) {
          router.push('/')
          return
        }

        // Validate session with backend
        const validation = await validateSession(sessionId || undefined, accessToken || undefined)
        
        if (validation.valid) {
          setSessionValid(true)
          setUser({
            userId: validation.userId || userId || 'unknown',
            username: username || undefined,
            displayName: displayName || undefined
          })
        } else {
          // Session invalid, clear storage and redirect
          localStorage.removeItem('sessionId')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('userId')
          localStorage.removeItem('username')
          localStorage.removeItem('displayName')
          router.push('/')
        }
      } catch (error) {
        console.error('Session validation error:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const handleSignOut = () => {
    // Clear all session data
    localStorage.removeItem('sessionId')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('displayName')
    
    // Redirect to home
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Validating session...</p>
        </div>
      </div>
    )
  }

  if (!sessionValid || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.displayName || user.username || user.userId}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                🎉 Authentication Successful!
              </h2>
              <p className="mt-2 text-gray-600">
                You have successfully completed the OTP verification and secure session creation process.
              </p>
              
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session Information</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.userId}</dd>
                  </div>
                  {user.username && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                    </div>
                  )}
                  {user.displayName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.displayName}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Session Status</dt>
                    <dd className="mt-1 text-sm text-green-600 font-medium">✅ Active & Secure</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8 text-sm text-gray-500">
                <p>
                  This dashboard demonstrates the complete authentication flow:
                </p>
                <ul className="mt-2 text-left max-w-md mx-auto space-y-1">
                  <li>✅ OTP verification completed</li>
                  <li>✅ User routing (sign-in/register) handled</li>
                  <li>✅ Secure session created</li>
                  <li>✅ Session validation working</li>
                  <li>✅ Protected route access granted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
