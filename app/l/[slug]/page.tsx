import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { GateContent } from "@/components/gate/gate-content"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function GatePage({ params }: PageProps) {
  const { slug } = await params

  const link = await prisma.link.findUnique({
    where: { slug },
  })

  if (!link || !link.isActive) {
    notFound()
  }

  // Increment view count
  await prisma.link.update({
    where: { id: link.id },
    data: { views: { increment: 1 } },
  })

  return (
    <GateContent
      link={{
        id: link.id,
        slug: link.slug,
        dest_url: link.destUrl,
        title: link.title,
        ads_required: link.adsRequired,
      }}
    />
  )
}
