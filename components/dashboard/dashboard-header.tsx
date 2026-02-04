"use client"

import { User } from "@clerk/nextjs/server"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Link2, Plus, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  user: User
  onCreateClick: () => void
}

export function DashboardHeader({ user, onCreateClick }: DashboardHeaderProps) {
  const router = useRouter()
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  const userEmail = user.emailAddresses[0]?.emailAddress ?? ""
  const userInitials = userEmail.slice(0, 2).toUpperCase() || "U"

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Link2 className="h-6 w-6" />
          <span className="text-xl font-bold">LootLinks</span>
        </div>
        <div className="flex items-center gap-4">
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
                {userEmail}
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
