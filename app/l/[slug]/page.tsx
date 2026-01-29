import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GateContent } from "@/components/gate/gate-content"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function GatePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: link, error } = await supabase
    .from("links")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !link) {
    notFound()
  }

  // Increment view count
  await supabase
    .from("links")
    .update({ views: link.views + 1 })
    .eq("id", link.id)

  return <GateContent link={link} />
}
