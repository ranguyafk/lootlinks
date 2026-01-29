"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Trash2, Eye, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Link {
  id: string
  slug: string
  destination_url: string
  title: string | null
  ads_required: number
  views: number
  completions: number
  is_active: boolean
  created_at: string
}

interface LinksListProps {
  links: Link[]
  onDelete: (id: string) => void
  onToggle: (id: string, isActive: boolean) => void
}

export function LinksList({ links, onDelete, onToggle }: LinksListProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/l/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  const handleToggle = async (link: Link) => {
    setLoadingStates((prev) => ({ ...prev, [link.id]: true }))
    
    const { error } = await supabase
      .from("links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id)

    if (error) {
      toast.error("Failed to update link")
    } else {
      onToggle(link.id, !link.is_active)
      toast.success(link.is_active ? "Link deactivated" : "Link activated")
    }
    
    setLoadingStates((prev) => ({ ...prev, [link.id]: false }))
  }

  const handleDelete = async (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }))
    
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Failed to delete link")
      setLoadingStates((prev) => ({ ...prev, [id]: false }))
    } else {
      onDelete(id)
      toast.success("Link deleted")
    }
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ExternalLink className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No links yet</CardTitle>
          <CardDescription>Create your first monetized link to get started</CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Links</h2>
      {links.map((link) => (
        <Card key={link.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">
                    {link.title || link.slug}
                  </h3>
                  <Badge variant={link.is_active ? "default" : "secondary"}>
                    {link.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {link.destination_url}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {link.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {link.completions} completions
                  </span>
                  <span>{link.ads_required} ads required</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={link.is_active}
                  onCheckedChange={() => handleToggle(link)}
                  disabled={loadingStates[link.id]}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyLink(link.slug)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={`/l/${link.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(link.id)}
                  disabled={loadingStates[link.id]}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
