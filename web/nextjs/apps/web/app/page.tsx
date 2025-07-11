"use client"

import { Button } from "@workspace/ui/components/button"
import Header from "../components/header"
import { useEffect, useState } from "react"

export default function Page() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
