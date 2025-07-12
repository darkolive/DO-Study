'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

export default function DashboardPage() {
  const { user, sessionValid, showSuccessMessage, setShowSuccessMessage, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to home if no valid session
    if (!sessionValid && !user) {
      const sessionId = localStorage.getItem('sessionId')
      const accessToken = localStorage.getItem('accessToken')
      
      if (!sessionId || !accessToken) {
        router.push('/')
      }
    }
  }, [sessionValid, user, router])

  // Use the global signOut function instead of local implementation

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
                onClick={signOut}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-medium">✅ Hi you are now logged in!</span>
                {' '}Your authentication was successful and your secure session is active.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowSuccessMessage(false)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
