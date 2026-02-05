import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { url, slug } = await request.json();
  if (!url || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const link = await prisma.link.create({
    data: { url, slug, ownerId: userId },
  });

  return NextResponse.json(link);
}
