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

// CerberusMFA Integration - User Routing After OTP Verification
export async function checkUserAndRoute(channelDID: string, channelType: string) {
  console.log('🐕 checkUserAndRoute called with:', { channelDID, channelType })
  
  const query = `
    query CheckUserAndRoute($req: CerberusMFARequestInput!) {
      checkUserAndRoute(req: $req) {
        userExists
        action
        userID
        availableMethods
        nextStep
        message
      }
    }
  `;

  console.log('📡 Calling CerberusMFA endpoint')
  
  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        channelDID,
        channelType
      }
    }
  })

  if (error) {
    console.error('❌ Error checking user route:', error)
    return { userExists: false, action: 'register', message: 'Failed to check user status' }
  }

  console.log('✅ checkUserAndRoute response:', data.checkUserAndRoute)
  return data.checkUserAndRoute
}

// Session Management Interfaces (will be used when session management is implemented)

// Session Management Functions

export async function createSession(userId: string, channelDID: string, action: string) {
  console.log('🔐 createSession called with:', { userId, channelDID, action })
  
  const mutation = `
    mutation CreateSession($req: SessionRequestInput!) {
      createSession(req: $req) {
        success
        sessionID
        accessToken
        expiresAt
        message
        userID
      }
    }
  `;

  const { data, error } = await fetchQuery({
    query: mutation,
    variables: {
      req: {
        userID: userId,
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
  console.log('🔍 validateSession called with:', { sessionId: sessionId ? '***' : 'undefined', accessToken: accessToken ? '***' : 'undefined' })
  
  // Use the JWT token (both sessionId and accessToken contain the same JWT token)
  const jwtToken = accessToken || sessionId
  if (!jwtToken) {
    console.log('❌ No JWT token provided for validation')
    return { valid: false, message: 'No token provided' }
  }
  
  const query = `
    query ValidateSession($req: ValidationRequestInput!) {
      validateSession(req: $req) {
        valid
        userID
        message
        expiresAt
      }
    }
  `
  
  const variables = {
    req: {
      token: jwtToken
    }
  }

  console.log('🔍 Sending validation request with token:', jwtToken.substring(0, 20) + '...')

  const { data, error } = await fetchQuery({
    query,
    variables
  })

  if (error) {
    console.error('Error validating session:', error)
    return { valid: false, message: 'Failed to validate session' }
  }

  console.log('✅ validateSession response:', data.validateSession)
  return data.validateSession
}

// Server-side session validation (called with credentials from client)
export async function validateSessionWithCredentials(sessionId?: string, accessToken?: string) {
  console.log('🔍 validateSessionWithCredentials called')
  
  if (!sessionId && !accessToken) {
    console.log('❌ No session credentials provided')
    return { valid: false, message: 'No session credentials provided' }
  }
  
  // Validate the session with the backend
  return await validateSession(sessionId || undefined, accessToken || undefined)
}

// WebAuthn Integration

// WebAuthn Types (will be re-added when needed for future WebAuthn UI enhancements)

// WebAuthn GraphQL Functions

export async function createWebAuthnRegistrationChallenge(userID: string, username: string, displayName: string) {
  console.log('🔐 Creating WebAuthn registration challenge for:', userID)
  
  const query = `
    mutation CreateWebAuthnRegistrationChallenge($req: WebAuthnChallengeRequestInput!) {
      createWebAuthnRegistrationChallenge(req: $req) {
        challenge
        rp {
          id
          name
        }
        user {
          id
          name
          displayName
        }
        pubKeyCredParams {
          type
          alg
        }
        timeout
        excludeCredentials {
          type
          id
        }
        attestation
        authenticatorSelection {
          authenticatorAttachment
          userVerification
          requireResidentKey
        }
      }
    }
  `

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        userID,
        username,
        displayName
      }
    }
  })

  if (error) {
    console.error('Error creating WebAuthn registration challenge:', error)
    throw new Error('Failed to create WebAuthn registration challenge')
  }

  console.log('✅ WebAuthn registration challenge created')
  return data.createWebAuthnRegistrationChallenge
}

export async function verifyWebAuthnRegistration(userID: string, challenge: string, clientDataJSON: string, attestationObject: string) {
  console.log('🔐 Verifying WebAuthn registration for:', userID)
  
  const query = `
    mutation VerifyWebAuthnRegistration($req: WebAuthnRegistrationRequestInput!) {
      verifyWebAuthnRegistration(req: $req) {
        success
        credentialID
        message
      }
    }
  `

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        userID,
        challenge,
        clientDataJSON,
        attestationObject
      }
    }
  })

  if (error) {
    console.error('Error verifying WebAuthn registration:', error)
    throw new Error('Failed to verify WebAuthn registration')
  }

  console.log('✅ WebAuthn registration verified')
  return data.verifyWebAuthnRegistration
}

export async function createWebAuthnAuthChallenge(userID: string) {
  console.log('🔐 Creating WebAuthn auth challenge for:', userID)
  
  const query = `
    mutation CreateWebAuthnAuthenticationChallenge($req: WebAuthnAssertionChallengeRequestInput!) {
      createWebAuthnAuthenticationChallenge(req: $req) {
        challenge
        timeout
        allowCredentials {
          type
        }
        userVerification
      }
    }
  `

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        userID
      }
    }
  })

  if (error) {
    console.error('Error creating WebAuthn auth challenge:', error)
    throw new Error('Failed to create WebAuthn auth challenge')
  }

  console.log('✅ WebAuthn auth challenge created')
  return data.createWebAuthnAuthenticationChallenge
}

export async function verifyWebAuthnAuth(userID: string, challenge: string, clientDataJSON: string, authenticatorData: string, signature: string, userHandle?: string) {
  console.log('🔐 Verifying WebAuthn authentication for:', userID)
  
  const query = `
    query VerifyWebAuthnAuthentication($req: WebAuthnAuthRequestInput!) {
      verifyWebAuthnAuthentication(req: $req) {
        success
        userID
        sessionID
        message
      }
    }
  `

  const { data, error } = await fetchQuery({
    query,
    variables: {
      req: {
        userID,
        challenge,
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle: userHandle || userID // Use provided userHandle or fallback to userID
      }
    }
  })

  if (error) {
    console.error('Error verifying WebAuthn authentication:', error)
    throw new Error('Failed to verify WebAuthn authentication')
  }

  console.log('✅ WebAuthn authentication verified')
  return data.verifyWebAuthnAuthentication
}
