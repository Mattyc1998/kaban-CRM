import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PortalView } from "@/components/portal/portal-view";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { portalSlug: slug },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "desc" } },
      milestones: { orderBy: { dueAt: "asc" } },
    },
  });

  if (!project) notFound();

  return <PortalView project={project} />;
}
