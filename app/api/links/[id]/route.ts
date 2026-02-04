import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id } = await params

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "BAD_JSON" }, { status: 400 })
  }

  try {
    // Verify the link belongs to the user
    const existingLink = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingLink || existingLink.userId !== userId) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    const link = await prisma.link.update({
      where: { id },
      data: {
        isActive: body.is_active,
      },
    })

    return NextResponse.json({ data: link }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "UPDATE_FAILED" }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id } = await params

  try {
    // Verify the link belongs to the user
    const existingLink = await prisma.link.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingLink || existingLink.userId !== userId) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }

    await prisma.link.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "DELETE_FAILED" }, { status: 500 })
  }
}
