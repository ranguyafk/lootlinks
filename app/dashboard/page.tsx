import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) {
    redirect("/auth/sign-in")
  }

  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.emailAddresses[0]?.emailAddress ?? "" },
    update: { email: user.emailAddresses[0]?.emailAddress ?? "" },
  })

  const links = await prisma.link.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  // Transform Prisma data to match component interface
  const transformedLinks = links.map((link) => ({
    id: link.id,
    slug: link.slug,
    dest_url: link.destUrl,
    title: link.title,
    ads_required: link.adsRequired,
    views: link.views,
    completions: link.completions,
    is_active: link.isActive,
    created_at: link.createdAt.toISOString(),
  }))

  return <DashboardContent user={user} initialLinks={transformedLinks} />
}
