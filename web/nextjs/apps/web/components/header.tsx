"use client"

import { Search, User, Mail, MessageSquare, Phone, Send } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { sendOTP, verifyOTP, checkUserAndRoute, createWebAuthnRegistrationChallenge, verifyWebAuthnRegistration, createWebAuthnAuthChallenge, verifyWebAuthnAuth } from "@/lib/actions"

type Channel = "email" | "sms" | "whatsapp" | "telegram"
type AuthStep = "channel-selection" | "input" | "otp" | "method-selection" | "webauthn" | "passwordless" | "verified"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>("channel-selection")
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [channelInput, setChannelInput] = useState("")
  const [otpInput, setOtpInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [routingData, setRoutingData] = useState<{
    channelDID: string
    action: string
    userID?: string
    availableMethods: string[]
  } | null>(null)


  // Helper functions
  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case "email":
        return <Mail className="h-5 w-5" />
      case "sms":
        return <Phone className="h-5 w-5" />
      case "whatsapp":
        return <MessageSquare className="h-5 w-5" />
      case "telegram":
        return <Send className="h-5 w-5" />
      default:
        return <Mail className="h-5 w-5" />
    }
  }

  const getChannelLabel = (channel: Channel) => {
    switch (channel) {
      case "email":
        return "Email"
      case "sms":
        return "SMS"
      case "whatsapp":
        return "WhatsApp"
      case "telegram":
        return "Telegram"
      default:
        return "Email"
    }
  }

  const getInputPlaceholder = (channel: Channel) => {
    switch (channel) {
      case "email":
        return "Enter your email address"
      case "sms":
        return "Enter your phone number"
      case "whatsapp":
        return "Enter your WhatsApp number"
      case "telegram":
        return "Enter your Telegram username"
      default:
        return "Enter your email address"
    }
  }

  const getInputType = (channel: Channel) => {
    switch (channel) {
      case "email":
        return "email"
      case "sms":
      case "whatsapp":
        return "tel"
      case "telegram":
        return "text"
      default:
        return "email"
    }
  }

  // Event handlers
  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
    setAuthStep("input")
    setError("")
  }

  const handleChannelSubmit = async () => {
    if (!selectedChannel || !channelInput.trim()) {
      setError("Please enter your contact information")
      return
    }

    setIsLoading(true)
    setError("")
    console.log("🔄 Starting OTP send for:", { selectedChannel, channelInput })

    try {
      const result = await sendOTP(selectedChannel, channelInput.trim())
      console.log("📥 Received result from sendOTP:", result)
      console.log("🔍 result.sent type:", typeof result.sent, "value:", result.sent)

      if (result.sent) {
        console.log("✅ OTP sent successfully, advancing to OTP step")
        setAuthStep("otp")
        console.log("🎯 Auth step set to: otp")
      } else {
        console.log("❌ OTP not sent, showing error")
        setError(result.message || "Failed to send OTP")
      }
    } catch (err) {
      console.error("💥 Exception in handleChannelSubmit:", err)
      setError("Failed to send OTP. Please try again.")
      console.error("OTP send error:", err)
    } finally {
      console.log("🏁 Setting loading to false")
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await verifyOTP(channelInput.trim(), otpInput)
      console.log("🔍 OTP verification result:", result)

      if (result.verified) {
        console.log("✅ OTP verified, checking user routing...")
        
        // Call CerberusMFA to determine if user exists
        const routingResult = await checkUserAndRoute(result.channelDID, selectedChannel || "email")
        console.log("🐕 CerberusMFA routing result:", routingResult)
        
        // Store routing data for authentication method selection
        setRoutingData({
          channelDID: result.channelDID,
          action: routingResult.action,
          userID: routingResult.userID,
          availableMethods: routingResult.availableMethods
        })
        
        // Go to method selection step
        console.log("🔐 Proceeding to authentication method selection")
        setAuthStep("method-selection")
      } else {
        setError(result.message || "Invalid OTP code")
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.")
      console.error("OTP verify error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetAuth = () => {
    setAuthStep("channel-selection")
    setSelectedChannel(null)
    setChannelInput("")
    setOtpInput("")
    setError("")
    setIsLoading(false)
    setRoutingData(null)

  }

  // WebAuthn handler functions
  const handleWebAuthnRegistration = async () => {
    if (!routingData?.channelDID) return

    try {
      setIsLoading(true)
      
      // Step 1: Get registration challenge from backend
      const challengeResponse = await createWebAuthnRegistrationChallenge(
        routingData.channelDID, // userID
        channelInput, // username
        channelInput // displayName
      )

      if (!challengeResponse.success || !challengeResponse.challenge) {
        setError(challengeResponse.message || 'Failed to get registration challenge')
        return
      }



      // Step 2: Create credential using browser WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(Buffer.from(challengeResponse.challenge, 'base64')),
          rp: {
            name: "DO Study",
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(Buffer.from(challengeResponse.userID || '', 'utf-8')),
            name: channelInput,
            displayName: channelInput
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) {
        setError('Failed to create credential')
        return
      }

      const response = credential.response as AuthenticatorAttestationResponse
      
      // Step 3: Verify registration with backend
      const verificationResponse = await verifyWebAuthnRegistration(
        routingData.channelDID, // userID
        challengeResponse.challenge, // challenge
        btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))), // clientDataJSON as base64
        btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))) // attestationObject as base64
      )

      if (verificationResponse.success) {
        setAuthStep("verified")
      } else {
        setError(verificationResponse.message || 'Registration verification failed')
      }
    } catch (error) {
      setError(`WebAuthn registration error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebAuthnAuthentication = async () => {
    if (!routingData?.channelDID) return

    try {
      setIsLoading(true)
      
      // Step 1: Get authentication challenge from backend
      const challengeResponse = await createWebAuthnAuthChallenge(
        routingData.channelDID // userID
      )

      if (!challengeResponse || !challengeResponse.challenge) {
        setError('Failed to get auth challenge - invalid response')
        return
      }



      // Step 2: Get credential using browser WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(Buffer.from(challengeResponse.challenge, 'base64')),
          rpId: window.location.hostname,
          allowCredentials: challengeResponse.allowCredentials?.map((cred: { type?: string }) => ({
            type: cred.type || 'public-key',
            // Note: Backend GraphQL schema doesn't expose credential ID
            // WebAuthn will work with empty allowCredentials for resident credentials
          })).filter((cred: { type: string }) => cred.type) || [],
          userVerification: "required",
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) {
        setError('Failed to get credential')
        return
      }

      const response = credential.response as AuthenticatorAssertionResponse
      
      // Extract userHandle if available (optional field in WebAuthn)
      const userHandle = response.userHandle 
        ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle)))
        : undefined
      
      // Step 3: Verify authentication with backend
      const verificationResponse = await verifyWebAuthnAuth(
        routingData.channelDID, // userID
        challengeResponse.challenge, // challenge
        btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))), // clientDataJSON as base64
        btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))), // authenticatorData as base64
        btoa(String.fromCharCode(...new Uint8Array(response.signature))), // signature as base64
        userHandle // userHandle as base64 (optional)
      );

      console.log('🔍 WebAuthn verification response:', verificationResponse)
      console.log('🔍 Response type:', typeof verificationResponse)
      console.log('🔍 Response success field:', verificationResponse?.success)

      if (verificationResponse?.success) {
        console.log('✅ WebAuthn verification successful, setting verified state')
        
        // Store session credentials in localStorage for session validation
        // Both sessionID and accessToken contain the JWT token from ChronosSession
        if (verificationResponse.sessionID) {
          localStorage.setItem('sessionId', verificationResponse.sessionID)
          console.log('💾 Stored sessionId (JWT token) in localStorage')
        }
        if (verificationResponse.accessToken) {
          localStorage.setItem('accessToken', verificationResponse.accessToken)
          console.log('💾 Stored accessToken (JWT token) in localStorage')
        }
        if (verificationResponse.userID) {
          localStorage.setItem('userID', verificationResponse.userID)
          console.log('💾 Stored userID in localStorage')
        }
        
        setAuthStep("verified")
      } else {
        console.log('❌ WebAuthn verification failed:', verificationResponse)
        setError(verificationResponse?.message || 'Authentication verification failed')
      }
    } catch (error) {
      setError(`WebAuthn authentication error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToChannels = () => {
    setAuthStep("channel-selection")
    setSelectedChannel(null)
    setError("")
  }

  const handleBackToInput = () => {
    setAuthStep("input")
    setError("")
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      action()
    }
  }

  const renderAuthContent = () => {
    switch (authStep) {
      case "channel-selection":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Choose Authentication Method</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select how you&apos;d like to receive your verification code
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["email", "sms", "whatsapp", "telegram"] as const).map((channel) => (
                <Button
                  key={channel}
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-muted"
                  onClick={() => handleChannelSelect(channel)}
                >
                  {getChannelIcon(channel)}
                  <span className="text-sm">{getChannelLabel(channel)}</span>
                </Button>
              ))}
            </div>
          </div>
        )

      case "input":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBackToChannels}>
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                {selectedChannel && getChannelIcon(selectedChannel)}
                <span className="font-medium">
                  {selectedChannel && getChannelLabel(selectedChannel)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-input">
                {selectedChannel && getChannelLabel(selectedChannel)} Address
              </Label>
              <Input
                id="channel-input"
                type={selectedChannel ? getInputType(selectedChannel) : "email"}
                placeholder={selectedChannel ? getInputPlaceholder(selectedChannel) : ""}
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleChannelSubmit)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <Button
              onClick={handleChannelSubmit}
              disabled={isLoading || !channelInput.trim()}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </div>
        )

      case "otp":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBackToInput}>
                ← Back
              </Button>
              <span className="text-sm text-muted-foreground">
                Code sent to {selectedChannel && getChannelLabel(selectedChannel).toLowerCase()}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp-input">Verification Code</Label>
              <Input
                id="otp-input"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setOtpInput(value)
                }}
                onKeyPress={(e) => handleKeyPress(e, handleOtpSubmit)}
                disabled={isLoading}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <Button
              onClick={handleOtpSubmit}
              disabled={isLoading || otpInput.length !== 6}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
            <div className="text-center">
              <Button variant="link" size="sm" onClick={handleChannelSubmit}>
                Didn&apos;t receive code? Resend
              </Button>
            </div>
          </div>
        )

      case "method-selection":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl">🔐</div>
              <h3 className="text-lg font-semibold mt-2">
                Choose Authentication Method
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {routingData?.action === "signin" ? "Welcome back! How would you like to sign in?" : "How would you like to authenticate?"}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setAuthStep("webauthn")
                  // Trigger WebAuthn flow based on action type
                  if (routingData?.action === "signin") {
                    handleWebAuthnAuthentication()
                  } else {
                    handleWebAuthnRegistration()
                  }
                }}
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🔐</span>
                  <div className="text-left">
                    <div className="font-semibold">WebAuthn</div>
                    <div className="text-xs opacity-90">Biometric or Security Key</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={() => setAuthStep("passwordless")}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📧</span>
                  <div className="text-left">
                    <div className="font-semibold">Passwordless</div>
                    <div className="text-xs text-muted-foreground">Magic Link via Email</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )

      case "webauthn":
        return (
          <div className="space-y-4 text-center">
            <div className="text-4xl">🔐</div>
            <div>
              <h3 className="text-lg font-semibold">
                {routingData?.action === "signin" ? "Authenticate with WebAuthn" : "Register WebAuthn Credential"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading 
                  ? (routingData?.action === "signin" 
                    ? "Authenticating with your biometric or security key..." 
                    : "Setting up biometric or security key authentication...") 
                  : (routingData?.action === "signin" 
                    ? "Use your biometric or security key to sign in" 
                    : "Set up biometric or security key authentication")}
              </p>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Processing...
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAuthStep("method-selection")}
                disabled={isLoading}
              >
                ← Back
              </Button>
            </div>
          </div>
        )

      case "passwordless":
        return (
          <div className="space-y-4 text-center">
            <div className="text-4xl">📧</div>
            <div>
              <h3 className="text-lg font-semibold">
                Passwordless Authentication
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll send a magic link to your email
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Coming soon...
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAuthStep("method-selection")}
                disabled={isLoading}
              >
                ← Back
              </Button>
            </div>
          </div>
        )

      case "verified":
        return (
          <div className="space-y-4 text-center">
            <div className="text-6xl">🎉</div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">
                Successfully Verified!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome to DO Study
              </p>
            </div>
            <Button onClick={() => setIsAuthOpen(false)} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <div className="mr-6 flex items-center space-x-2">
            <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded" />
            <span className="hidden font-bold sm:inline-block">
              DO Study
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          <nav className="flex items-center">
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={() => resetAuth()}>
                <DialogHeader>
                  <DialogTitle>Authentication</DialogTitle>
                  <DialogDescription>
                    Secure multi-step verification
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {renderAuthContent()}
                </div>
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      </div>
    </header>
  )
}
