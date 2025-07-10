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
        'Authorization': `Bearer ${process.env.HYPERMODE_API_KEY}`,
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
  
  const graphqlQuery = `
    mutation SendOTP($req: OTPRequest!) {
      sendOTP(req: $req) {
        otpId
        sent
        channel
        message
      }
    }
  `

  console.log('📡 Calling GraphQL endpoint:', process.env.HYPERMODE_API_ENDPOINT)
  
  const { data, error } = await fetchQuery({
    query: graphqlQuery,
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
  const graphqlQuery = `
    mutation VerifyOTP($req: VerifyOTPRequest!) {
      verifyOTP(req: $req) {
        verified
        channelDID
        message
        userId
      }
    }
  `

  const { data, error } = await fetchQuery({
    query: graphqlQuery,
    variables: {
      req: {
        recipient,
        otpCode
      }
    }
  })

  if (error) {
    console.error('Error verifying OTP:', error)
    return { verified: false, message: 'Failed to verify OTP' }
  }

  return data.verifyOTP
}
