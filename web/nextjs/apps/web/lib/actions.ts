'use server'

type FetchQueryProps = {
  query: string
  variables?: Record<string, unknown>
}

const fetchQuery = async ({ query, variables }: FetchQueryProps) => {
  try {
    const res = await fetch(process.env.HYPERMODE_API_ENDPOINT as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(res.statusText)

    const { data, errors } = await res.json()
    if (errors) throw new Error(JSON.stringify(errors))

    return { data }
  } catch (err) {
    console.error('Error in fetchQuery:', err)
    return { data: null, error: err }
  }
}

export async function sendOTP(channel: string, recipient: string) {
  console.log('🚀 sendOTP called with:', { channel, recipient })
  
  const query = `
    query SendOTP($req: OTPRequestInput!) {
      sendOTP(req: $req) {
        oTPID
        sent
        channel
        expiresAt
        message
      }
    }
  `;

  console.log('📡 Calling GraphQL endpoint:', process.env.HYPERMODE_API_ENDPOINT)
  
  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        channel,
        recipient
      }
    }
  })

  if (error) {
    console.error('❌ Error sending OTP:', error)
    return { sent: false, message: 'Failed to send OTP' }
  }

  console.log('✅ sendOTP response:', data.sendOTP)
  return data.sendOTP
}

export async function verifyOTP(recipient: string, otpCode: string) {
  const query = `
    query VerifyOTP($req: VerifyOTPRequestInput!) {
      verifyOTP(req: $req) {
        verified
        message
        userID
        action
        channelDID
      }
    }
  `;

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        recipient,
        oTPCode: otpCode
      }
    }
  })

  if (error) {
    console.error('Error verifying OTP:', error)
    return { verified: false, message: 'Failed to verify OTP' }
  }

  return data.verifyOTP
}

// Session Management Interfaces
interface SessionRequest {
  userId: string
  channelDID: string
  action: string
}

interface SessionResponse {
  success: boolean
  sessionId: string
  accessToken: string
  expiresAt: number
  message: string
  userId: string
}

interface ValidateSessionRequest {
  sessionId?: string
  accessToken?: string
}

interface ValidateSessionResponse {
  valid: boolean
  userId?: string
  message: string
  expiresAt?: number
}

// Session Management Functions

export async function createSession(userId: string, channelDID: string, action: string) {
  console.log('🔐 createSession called with:', { userId, channelDID, action })
  
  const query = `
    query CreateSession($req: SessionRequestInput!) {
      createSession(req: $req) {
        success
        sessionId
        accessToken
        expiresAt
        message
        userId
      }
    }
  `;

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        userId,
        channelDID,
        action
      }
    }
  })

  if (error) {
    console.error('Error creating session:', error)
    return { success: false, message: 'Failed to create session' }
  }

  console.log('✅ createSession response:', data.createSession)
  return data.createSession
}

export async function validateSession(sessionId?: string, accessToken?: string) {
  console.log('🔍 validateSession called with:', { sessionId: sessionId ? '***' : undefined, accessToken: accessToken ? '***' : undefined })
  
  const query = `
    query ValidateSession($req: ValidateSessionRequestInput!) {
      validateSession(req: $req) {
        valid
        userId
        message
        expiresAt
      }
    }
  `;

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        sessionId,
        accessToken
      }
    }
  })

  if (error) {
    console.error('Error validating session:', error)
    return { valid: false, message: 'Failed to validate session' }
  }

  console.log('✅ validateSession response:', data.validateSession)
  return data.validateSession
}
