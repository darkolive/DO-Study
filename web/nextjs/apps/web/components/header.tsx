"use client"

import { Search, User, Mail, MessageSquare, Phone, Send } from "lucide-react"
import { useState } from "react"
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@workspace/ui/components/input-otp"
import { sendOTP, verifyOTP } from "@/lib/actions"

type AuthStep = 'channel-selection' | 'input' | 'otp' | 'verified'
type Channel = 'email' | 'sms' | 'whatsapp' | 'telegram'

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('channel-selection')
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [channelInput, setChannelInput] = useState("")
  const [otpInput, setOtpInput] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
    setAuthStep('input')
    setError(null) // Clear any previous errors
  }

  const handleChannelSubmit = async () => {
    if (!channelInput.trim()) return
    
    console.log('🎯 Frontend: handleChannelSubmit called', { selectedChannel, channelInput })
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📞 Frontend: Calling sendOTP server action...')
      const result = await sendOTP(selectedChannel!, channelInput)
      console.log('📥 Frontend: sendOTP result:', result)
      
      if (result.sent) {
        setAuthStep('otp')
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch (err) {
      console.error('💥 Frontend: Error in handleChannelSubmit:', err)
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    if (!otpInput.trim() || otpInput.length !== 6) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await verifyOTP(channelInput, otpInput)
      if (result.verified) {
        setAuthStep('verified')
      } else {
        setError(result.message || 'Invalid OTP code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const resetAuth = () => {
    setAuthStep('channel-selection')
    setSelectedChannel(null)
    setChannelInput('')
    setOtpInput('')
  }

  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case 'email': return <Mail className="h-6 w-6" />
      case 'sms': return <Phone className="h-6 w-6" />
      case 'whatsapp': return <MessageSquare className="h-6 w-6" />
      case 'telegram': return <Send className="h-6 w-6" />
    }
  }

  const getChannelLabel = (channel: Channel) => {
    switch (channel) {
      case 'email': return 'Email'
      case 'sms': return 'SMS'
      case 'whatsapp': return 'WhatsApp'
      case 'telegram': return 'Telegram'
    }
  }

  const getInputPlaceholder = () => {
    switch (selectedChannel) {
      case 'email': return 'Enter your email address'
      case 'sms': return 'Enter your phone number'
      case 'whatsapp': return 'Enter your WhatsApp number'
      case 'telegram': return 'Enter your Telegram username'
      default: return ''
    }
  }

  const getInputType = () => {
    return selectedChannel === 'email' ? 'email' : 'text'
  }

  const renderAuthStep = () => {
    switch (authStep) {
      case 'channel-selection':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Sign In to DO Study</DialogTitle>
              <DialogDescription>
                How do you want to verify yourself?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                {(['email', 'sms', 'whatsapp', 'telegram'] as Channel[]).map((channel) => (
                  <Button
                    key={channel}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 hover:bg-accent"
                    onClick={() => handleChannelSelect(channel)}
                  >
                    {getChannelIcon(channel)}
                    <span className="text-sm">{getChannelLabel(channel)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )

      case 'input':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Enter your {getChannelLabel(selectedChannel!)}</DialogTitle>
              <DialogDescription>
                We&apos;ll send you a verification code
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-input">{getChannelLabel(selectedChannel!)}</Label>
                <Input
                  id="channel-input"
                  type={getInputType()}
                  placeholder={getInputPlaceholder()}
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleChannelSubmit()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetAuth} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleChannelSubmit} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            </div>
          </>
        )

      case 'otp':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code sent to your {getChannelLabel(selectedChannel!)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="otp-input">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpInput}
                    onChange={(value) => setOtpInput(value)}
                    onComplete={handleOtpSubmit}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAuthStep('input')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleOtpSubmit} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={async () => {
                    setIsLoading(true)
                    setError(null)
                    try {
                      await sendOTP(selectedChannel!, channelInput)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to resend OTP')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Resending...' : "Didn't receive code? Resend"}
                </Button>
              </div>
            </div>
          </>
        )

      case 'verified':
        return (
          <>
            <DialogHeader>
              <DialogTitle>✅ Verification Successful</DialogTitle>
              <DialogDescription>
                You are now verified and signed in!
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-center py-4">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-lg font-medium mb-2">Welcome to DO Study!</p>
                <p className="text-muted-foreground">You can now access your learning dashboard.</p>
              </div>
              <Button onClick={() => setIsSignInOpen(false)} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            DO
          </div>
          <span className="font-semibold text-lg">Study</span>
        </div>

        {/* Search Bar Section */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, topics, or resources..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sign In Section */}
        <div className="flex items-center space-x-2">
          <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 hidden sm:inline-block">Sign In</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sign In</DialogTitle>
              </DialogHeader>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {renderAuthStep()}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
