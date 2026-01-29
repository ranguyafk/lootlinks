import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false })

  return <DashboardContent user={user} initialLinks={links || []} />
}
