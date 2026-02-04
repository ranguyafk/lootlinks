import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const link_id = params.id

  const { data, error } = await supabase.rpc("increment_link_completion", { p_link_id: link_id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, link: data }, { status: 200 })
}
