import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { GateContent } from "@/components/gate/gate-content"

export default async function ShortLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const link = await prisma.link.findUnique({
    where: { slug },
  })

  if (!link || !link.isActive) notFound()

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
