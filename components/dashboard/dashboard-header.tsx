"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Link2, Plus, LogOut, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { reloadSchemaCache } from "@/lib/supabase/reload-schema"

interface DashboardHeaderProps {
  user: User
  onCreateClick: () => void
}

export function DashboardHeader({ user, onCreateClick }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [reloadLoading, setReloadLoading] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleReloadSchema = async () => {
    setReloadLoading(true)
    const result = await reloadSchemaCache()
    setReloadLoading(false)
    
    if (result.success) {
      toast.success('Database schema cache reloaded successfully')
    } else {
      toast.error(`Failed to reload schema: ${result.error}`)
    }
  }

  const userInitials = user.email?.slice(0, 2).toUpperCase() || "U"

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Link2 className="h-6 w-6" />
          <span className="text-xl font-bold">LootLinks</span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReloadSchema}
            disabled={reloadLoading}
            title="Reload database schema cache"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${reloadLoading ? 'animate-spin' : ''}`} />
            Reload Schema
          </Button>
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
