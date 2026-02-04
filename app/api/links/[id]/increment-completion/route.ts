import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const link = await prisma.link.update({
      where: { id },
      data: {
        completions: { increment: 1 },
        views: { increment: 1 },
      },
    })
    return NextResponse.json({ ok: true, link }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "FAILED" }, { status: 500 })
  }
}
