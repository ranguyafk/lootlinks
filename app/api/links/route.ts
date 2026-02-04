import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const CreateLinkSchema = z.object({
  title: z.string().trim().max(200).optional(),
  dest_url: z.string().url(),
  ads_required: z.coerce.number().int().min(1).max(5).default(3),
})

function randomSlug(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let out = ""
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "BAD_JSON" }, { status: 400 })
  }

  const parsed = CreateLinkSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]
    return NextResponse.json({ error: first?.message ?? "VALIDATION_ERROR" }, { status: 400 })
  }
  const { title, dest_url, ads_required } = parsed.data

  for (let attempt = 0; attempt < 7; attempt++) {
    try {
      const link = await prisma.link.create({
        data: {
          userId,
          title: title || null,
          destUrl: dest_url,
          adsRequired: ads_required,
          slug: randomSlug(8),
        },
      })
      return NextResponse.json({ data: link }, { status: 201 })
    } catch (err: any) {
      const msg = String(err?.message || "")
      if (!msg.includes("Unique constraint")) {
        return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 })
      }
    }
  }
  return NextResponse.json({ error: "SLUG_EXHAUSTED" }, { status: 500 })
}
