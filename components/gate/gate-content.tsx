"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ExternalLink, Link2, Loader2 } from "lucide-react"

interface Link {
  id: string
  slug: string
  dest_url: string
  title: string | null
  ads_required: number
}

interface GateContentProps {
  link: Link
}

export function GateContent({ link }: GateContentProps) {
  const [adsWatched, setAdsWatched] = useState(0)
  const [currentlyWatching, setCurrentlyWatching] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = Math.min(100, Math.round((adsWatched / link.ads_required) * 100))

  // Track click on mount
  useEffect(() => {
    const track = async () => {
      try {
        await fetch(`/api/gate/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link_id: link.id, slug: link.slug }),
        })
      } catch (error) {
        // Non-blocking
        console.warn("tracking failed", error)
      }
    }
    track()
  }, [link.id, link.slug])

  const handleComplete = useCallback(async () => {
    setUnlocked(true)
    try {
      const response = await fetch(`/api/links/${link.id}/increment-completion`, { method: "POST" })
      if (!response.ok) {
        const msg = await response.text()
        console.error("Failed to increment completion:", msg)
      }
    } catch (err) {
      console.error("Error incrementing completion:", err)
    }
  }, [link.id])

  useEffect(() => {
    if (adsWatched >= link.ads_required && !unlocked) {
      handleComplete()
    }
  }, [adsWatched, link.ads_required, unlocked, handleComplete])

  const watchAd = () => {
    setError(null)
    setCurrentlyWatching(true)
    setCountdown(5)
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (currentlyWatching && countdown === 0) {
      setCurrentlyWatching(false)
      setAdsWatched((prev) => prev + 1)
    }
  }, [countdown, currentlyWatching])

  const handleRedirect = () => {
    setRedirecting(true)
    window.location.href = link.dest_url
  }

  if (unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Link2 className="h-6 w-6" />
                <span className="text-xl font-bold">LootLinks</span>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Link Unlocked!</CardTitle>
            <CardDescription>
              You&apos;ve completed all required tasks. Click below to access your content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRedirect} className="w-full" size="lg" disabled={redirecting}>
              {redirecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {redirecting ? "Redirecting..." : "Go to Content"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Tasks to Unlock</CardTitle>
          <CardDescription>
            Watch ads or complete tasks to access the destination link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="mb-4">
            <div className="w-full bg-muted rounded h-2 overflow-hidden">
              <div className="bg-primary h-2 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {adsWatched} / {link.ads_required} tasks completed
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={watchAd} disabled={currentlyWatching} className="w-full">
              {currentlyWatching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Watching... {countdown}s left
                </>
              ) : (
                "Watch Ad (5s)"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
