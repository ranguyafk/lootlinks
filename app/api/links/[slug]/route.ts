import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const link = await prisma.link.findUnique({ where: { slug: params.slug } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (link.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.link.delete({ where: { slug: params.slug } });
  return NextResponse.json({ success: true });
}
