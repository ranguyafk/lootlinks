import prisma from "@/lib/db";

export default async function RedirectPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const link = await prisma.link.findUnique({ where: { slug } });
  if (!link) return <div>Link not found</div>;

  await prisma.link.update({
    where: { slug },
    data: {
      views: { increment: 1 },
      earnings: { increment: 0.002 }, // revenue per view
    },
  });

  return (
    <script dangerouslySetInnerHTML={{ __html: `window.location.replace("${link.url}")` }} />
  );
}
