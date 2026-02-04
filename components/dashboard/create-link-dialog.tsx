"use client"

import { useState } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"

const CreateLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be 200 characters or fewer")
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v)),
  dest_url: z.string().url("Please provide a valid URL"),
  ads_required: z.coerce.number().int().min(1).max(5).default(3),
})

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

function randomSlug(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let out = ""
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

export function CreateLinkDialog({ open, onOpenChange, onLinkCreated }: CreateLinkDialogProps) {
  const [title, setTitle] = useState("")
  const [destinationUrl, setDestinationUrl] = useState("")
  const [adsRequired, setAdsRequired] = useState([3])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const parsed = CreateLinkSchema.safeParse({
      title,
      dest_url: destinationUrl,
      ads_required: adsRequired[0],
    })
    if (!parsed.success) {
      const first = parsed.error.issues?.[0]
      setError(first ? `${first.path.join(".")}: ${first.message}` : "Invalid input")
      setLoading(false)
      return
    }
    const { title: validTitle, dest_url, ads_required } = parsed.data

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      setError(authError?.message || "You must be logged in to create links")
      setLoading(false)
      return
    }

    const basePayload = {
      user_id: user.id,
      dest_url,
      title: validTitle,
      ads_required,
    }

    let insert = await supabase.from("links").insert(basePayload).select().single()

    if (insert.error) {
      const errCode = insert.error.code
      const errMsg = insert.error.message || ""
      const looksLikeSlugRequired =
        errCode === "23502" ||
        /slug.*null|missing.*slug/i.test(insert.error.details || "") ||
        /slug/i.test(errMsg)

      if (looksLikeSlugRequired) {
        let final
        for (let attempt = 0; attempt < 7; attempt++) {
          const payloadWithSlug = { ...basePayload, slug: randomSlug(8) }
          final = await supabase.from("links").insert(payloadWithSlug).select().single()
          if (!final.error && final.data) {
            insert = final
            break
          }
          if (final?.error?.code !== "23505") {
            break
          }
        }
      }
    }

    if (insert.error || !insert.data) {
      setError(insert.error?.message || "Failed to create link")
      setLoading(false)
      return
    }

    toast.success("Link created successfully!")
    onLinkCreated(insert.data as Link)

    setTitle("")
    setDestinationUrl("")
    setAdsRequired([3])
    setLoading(false)
    onOpenChange(false)
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
              <Slider value={adsRequired} onValueChange={setAdsRequired} min={1} max={5} step={1} />
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
