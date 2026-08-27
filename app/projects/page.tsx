import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ stage: "asc" }, { position: "asc" }],
    include: {
      tasks: { select: { id: true, done: true } },
      files: { where: { kind: "DELIVERABLE" }, select: { id: true } },
      changeRequests: { where: { status: "PENDING" }, select: { id: true } },
    },
  });

  const activeProjects = projects.filter((p) => p.stage !== "COMPLETED");
  const activeCount = activeProjects.length;
  const activeBudget = activeProjects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <AppShell active="/projects">
      <ProjectsPageClient
        initialProjects={projects}
        activeCount={activeCount}
        activeBudget={activeBudget}
      />
    </AppShell>
  );
}
