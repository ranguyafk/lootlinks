import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isLikelyBot } from "@/lib/bots"
import { resolveCpm } from "@/lib/cpm"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "BAD_JSON" }, { status: 400 })
  }

  const link_id = String(payload?.link_id || "")
  const slug = String(payload?.slug || "")
  if (!link_id || !slug) {
    return NextResponse.json({ error: "MISSING_LINK" }, { status: 400 })
  }

  const ua = request.headers.get("user-agent") || ""
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (request as any).ip ||
    "0.0.0.0"

  const countryHeader = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || ""
  const country = countryHeader || "ZZ"

  const is_bot = isLikelyBot(ua)
  const cpm_usd = resolveCpm(country)

  const { data, error } = await supabase
    .from("link_events")
    .insert({
      link_id,
      slug,
      ip,
      user_agent: ua,
      country,
      is_bot,
      valid: !is_bot,
      cpm_usd,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, event: data }, { status: 201 })
}
