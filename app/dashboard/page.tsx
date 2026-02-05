import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Ensure user exists in DB
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.emailAddresses[0]?.emailAddress ?? "" },
    update: { email: user.emailAddresses[0]?.emailAddress ?? "" },
  });

  // Fetch user’s links including earnings
  const links = await prisma.link.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const transformedLinks = links.map((link) => ({
    id: link.id,
    slug: link.slug,
    dest_url: link.url,
    title: link.title ?? "",
    ads_required: link.adsRequired ?? 0,
    views: link.views,
    completions: link.completions ?? 0,
    is_active: link.isActive ?? true,
    created_at: link.createdAt.toISOString(),
    earnings: link.earnings ?? 0, // <-- NEW
  }));

  return <DashboardContent user={user} initialLinks={transformedLinks} />;
}
