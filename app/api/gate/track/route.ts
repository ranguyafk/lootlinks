import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isLikelyBot } from "@/lib/bots"
import { resolveCpm } from "@/lib/cpm"

interface TrackPayload {
  link_id: string
  slug: string
}

export async function POST(request: NextRequest) {
  let payload: TrackPayload
  try {
    const body = await request.json()
    payload = body as TrackPayload
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

  try {
    await prisma.linkEvent.create({
      data: {
        linkId: link_id,
        ip,
        userAgent: ua,
        country,
        isBot: is_bot,
        valid: !is_bot,
        cpmUsd: cpm_usd,
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: any) {
    const msg = String(err?.message || "")
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 })
    }
    return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 })
  }
}
