"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link2, ExternalLink, CheckCircle, Play, Loader2 } from "lucide-react"

interface Link {
  id: string
  slug: string
  destination_url: string
  title: string | null
  ads_required: number
  views: number
  completions: number
  is_active: boolean
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
  const supabase = createClient()

  const progress = (adsWatched / link.ads_required) * 100

  const handleComplete = useCallback(async () => {
    setUnlocked(true)
    // Increment completion count
    await supabase
      .from("links")
      .update({ completions: link.completions + 1 })
      .eq("id", link.id)
  }, [supabase, link.completions, link.id])

  useEffect(() => {
    if (adsWatched >= link.ads_required && !unlocked) {
      handleComplete()
    }
  }, [adsWatched, link.ads_required, unlocked, handleComplete])

  const watchAd = () => {
    setCurrentlyWatching(true)
    setCountdown(5) // 5 second simulated ad
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (currentlyWatching && countdown === 0) {
      setCurrentlyWatching(false)
      setAdsWatched((prev) => prev + 1)
    }
  }, [countdown, currentlyWatching])

  const handleRedirect = () => {
    setRedirecting(true)
    window.location.href = link.destination_url
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
              You&apos;ve completed all required ads. Click below to access your content.
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
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Link2 className="h-6 w-6" />
              <span className="text-xl font-bold">LootLinks</span>
            </div>
          </div>
          <CardTitle className="text-xl">
            {link.title || "Access Content"}
          </CardTitle>
          <CardDescription>
            Watch {link.ads_required} ad{link.ads_required > 1 ? "s" : ""} to unlock this link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{adsWatched} / {link.ads_required}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {currentlyWatching ? (
            <div className="rounded-lg bg-muted p-8 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
                  <Play className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="text-lg font-semibold mb-2">Watching Ad...</p>
              <p className="text-3xl font-bold text-primary">{countdown}s</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait for the ad to complete
              </p>
            </div>
          ) : (
            <Button
              onClick={watchAd}
              className="w-full"
              size="lg"
              disabled={adsWatched >= link.ads_required}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Ad {adsWatched + 1} of {link.ads_required}
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By watching these ads, you help support the content creator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
