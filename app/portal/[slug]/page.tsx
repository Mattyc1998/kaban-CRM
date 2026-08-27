import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PortalView } from "@/components/portal/portal-view";

async function getProject(slug: string) {
  return prisma.project.findUnique({
    where: { portalSlug: slug },
    include: {
      files: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "desc" } },
      milestones: { orderBy: { dueAt: "asc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Kaban CRM Client Portal" };
  return { title: `${project.clientCompany || project.clientName || project.name} — Client Portal` };
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return <PortalView project={project} />;
}
