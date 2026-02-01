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

    // Validate URL
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Log user authentication status (only in development)
    if (isDev) {
      console.log("[CreateLink] User authentication check:", {
        authenticated: !!user,
        userId: user?.id,
        userError: userError?.message
      })
    }

    if (!user) {
      if (isDev) {
        console.error("[CreateLink] User not authenticated")
      }
      setError("You must be logged in to create a link")
      setLoading(false)
      return
    }

    const slug = generateSlug()

    // Prepare the payload
    const payload = {
      user_id: user.id,
      slug,
      dest_url: destinationUrl,
      title: title || null,
      ads_required: adsRequired[0],
    }

    // Log the exact payload being sent (only in development)
    if (isDev) {
      console.log("[CreateLink] Inserting link with payload:", payload)
    }

    const { data, error: insertError } = await supabase
      .from("links")
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      // Log detailed error information (only in development)
      if (isDev) {
        console.error("[CreateLink] Supabase insert error:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          payload: payload
        })
      }

      // Handle unique constraint violation for slug
      if (insertError.code === '23505') {
        setError("Failed to generate unique link. Please try again.")
      } else if (insertError.code === '42703') {
        // Column does not exist error - PostgreSQL error code for undefined column
        setError("Database configuration error. Please contact support.")
      } else if (insertError.code === '42501') {
        // Insufficient privilege error - likely RLS policy issue
        setError("Permission denied. Please ensure you are properly authenticated.")
      } else {
        // Show sanitized error message, but log full details in dev
        const userMessage = isDev 
          ? `Failed to create link: ${insertError.message}`
          : "Failed to create link. Please try again or contact support if the problem persists."
        setError(userMessage)
      }
      setLoading(false)
      return
    }

    if (isDev) {
      console.log("[CreateLink] Link created successfully with slug:", data.slug)
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
