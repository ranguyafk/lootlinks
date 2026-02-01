"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Link {
  id: string
  slug: string
  dest_url: string
  title: string | null
  ads_required: number
  views: number
  completions: number
  is_active: boolean
  created_at: string
}

interface CreateLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinkCreated: (link: Link) => void
}

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function CreateLinkDialog({ open, onOpenChange, onLinkCreated }: CreateLinkDialogProps) {
  const [title, setTitle] = useState("")
  const [destinationUrl, setDestinationUrl] = useState("")
  const [adsRequired, setAdsRequired] = useState([3])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const isDev = process.env.NODE_ENV === 'development'

    // STEP 1: Validate URL
    try {
      new URL(destinationUrl)
    } catch {
      if (isDev) {
        console.error("[CreateLink] Invalid URL format:", destinationUrl)
      }
      setError("Please enter a valid URL")
      setLoading(false)
      return
    }

    // STEP 2: Check authentication BEFORE attempting insert
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      if (isDev) {
        console.error("[CreateLink] Authentication error:", userError)
      }
      setError("You must be logged in to create a link. Please log out and log in again.")
      setLoading(false)
      return
    }

    if (isDev) {
      console.log("[CreateLink] User authenticated:", {
        userId: user.id,
        email: user.email
      })
    }

    // STEP 3: Test Supabase connection first
    const { error: connectionError } = await supabase.from("links").select("id").limit(1)
    if (connectionError) {
      if (isDev) {
        console.error("[CreateLink] Connection test failed:", connectionError)
      }
      setError(`Cannot connect to database: ${connectionError.message}`)
      setLoading(false)
      return
    }

    if (isDev) {
      console.log("[CreateLink] Connection test successful")
    }

    // STEP 4: Retry logic for slug collisions (up to 5 attempts)
    let attempts = 0
    const maxAttempts = 5
    let insertSuccess = false
    let data = null
    let insertError = null

    while (attempts < maxAttempts && !insertSuccess) {
      attempts++
      const slug = generateSlug()
      
      const payload = {
        user_id: user.id,
        slug,
        dest_url: destinationUrl,
        title: title || null,
        ads_required: adsRequired[0],
      }

      if (isDev) {
        console.log(`[CreateLink] Attempt ${attempts}/${maxAttempts}:`, payload)
      }

      const result = await supabase
        .from("links")
        .insert(payload)
        .select()
        .single()

      if (!result.error) {
        insertSuccess = true
        data = result.data
      } else if (result.error.code === '23505') {
        // Slug collision, retry with new slug
        if (isDev) {
          console.warn(`[CreateLink] Slug collision on attempt ${attempts}, retrying...`)
        }
        insertError = result.error
        continue
      } else {
        // Other error, stop trying
        insertError = result.error
        break
      }
    }

    // STEP 5: Handle errors with specific messages
    if (insertError) {
      if (isDev) {
        console.error("[CreateLink] Insert failed after", attempts, "attempts:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })
      }

      if (insertError.code === '23505') {
        setError("Failed to generate a unique link ID after multiple attempts. Please try again.")
      } else if (insertError.code === '42703') {
        setError("Database schema error. Please contact support.")
      } else if (insertError.code === '42501') {
        setError("Permission denied. Your account may not have permission to create links. Please contact support.")
      } else if (insertError.code === 'PGRST301') {
        setError("Row Level Security policy violation. Please ensure you're properly authenticated.")
      } else {
        setError(`Failed to create link: ${insertError.message || 'Unknown error'}. Please contact support if this persists.`)
      }
      setLoading(false)
      return
    }

    // Success!
    if (isDev) {
      console.log("[CreateLink] Link created successfully:", data)
    }
    toast.success("Link created successfully!")
    onLinkCreated(data)
    
    // Reset form
    setTitle("")
    setDestinationUrl("")
    setAdsRequired([3])
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Link</DialogTitle>
          <DialogDescription>
            Create a monetized link that requires viewers to watch ads before accessing your content.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="My awesome link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Destination URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/your-content"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ads Required</Label>
                <span className="text-sm font-medium">{adsRequired[0]} ads</span>
              </div>
              <Slider
                value={adsRequired}
                onValueChange={setAdsRequired}
                min={1}
                max={5}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Viewers must watch {adsRequired[0]} ad{adsRequired[0] > 1 ? "s" : ""} before accessing your link
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
