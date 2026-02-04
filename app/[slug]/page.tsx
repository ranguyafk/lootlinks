import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GateContent } from "@/components/gate/gate-content"

export default async function ShortLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: link } = await supabase
    .from("links")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!link) notFound()

  return <GateContent link={link} />
}
