"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { DashboardHeader } from "./dashboard-header"
import { LinksList } from "./links-list"
import { CreateLinkDialog } from "./create-link-dialog"
import { StatsCards } from "./stats-cards"

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

interface DashboardContentProps {
  user: User
  initialLinks: Link[]
}

export function DashboardContent({ user, initialLinks }: DashboardContentProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleLinkCreated = (newLink: Link) => {
    setLinks([newLink, ...links])
    setCreateDialogOpen(false)
  }

  const handleLinkDeleted = (id: string) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const handleLinkToggled = (id: string, isActive: boolean) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, is_active: isActive } : link)))
  }

  const totalViews = links.reduce((acc, link) => acc + link.views, 0)
  const totalCompletions = links.reduce((acc, link) => acc + link.completions, 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader user={user} onCreateClick={() => setCreateDialogOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <StatsCards
          totalLinks={links.length}
          totalViews={totalViews}
          totalCompletions={totalCompletions}
        />
        <LinksList
          links={links}
          onDelete={handleLinkDeleted}
          onToggle={handleLinkToggled}
        />
      </main>
      <CreateLinkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLinkCreated={handleLinkCreated}
      />
    </div>
  )
}
