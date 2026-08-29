import type { PrismaClient, TaskPriority } from "@prisma/client";

// Hardcoded rather than DB-backed/editable — this is a single-user tool and
// the project shape barely varies; add a new entry here if a new project
// type comes up rather than building a template editor nobody's asked for.
export const PROJECT_TEMPLATES: {
  key: string;
  label: string;
  tasks: { title: string; priority: TaskPriority }[];
  milestones: { title: string; daysFromStart: number }[];
}[] = [
  {
    key: "website-build",
    label: "Standard Website Build",
    tasks: [
      { title: "Kickoff call & requirements gathering", priority: "HIGH" },
      { title: "Gather brand assets (logo, colors, copy)", priority: "HIGH" },
      { title: "Wireframe / sitemap", priority: "MEDIUM" },
      { title: "Homepage design", priority: "HIGH" },
      { title: "Inner page design", priority: "MEDIUM" },
      { title: "Build & responsive testing", priority: "HIGH" },
      { title: "Client review & revisions", priority: "MEDIUM" },
      { title: "Launch & DNS cutover", priority: "HIGH" },
    ],
    milestones: [
      { title: "Design sign-off", daysFromStart: 7 },
      { title: "Development complete", daysFromStart: 21 },
      { title: "Go live", daysFromStart: 28 },
    ],
  },
  {
    key: "landing-page",
    label: "Single Landing Page",
    tasks: [
      { title: "Kickoff call & requirements gathering", priority: "HIGH" },
      { title: "Copy & content draft", priority: "MEDIUM" },
      { title: "Design", priority: "HIGH" },
      { title: "Build & responsive testing", priority: "HIGH" },
      { title: "Client review & revisions", priority: "MEDIUM" },
      { title: "Launch", priority: "HIGH" },
    ],
    milestones: [
      { title: "Design sign-off", daysFromStart: 4 },
      { title: "Go live", daysFromStart: 10 },
    ],
  },
];

export function getProjectTemplate(key: string | undefined | null) {
  return PROJECT_TEMPLATES.find((t) => t.key === key);
}

// Shared by createProject (New Project dialog template picker) and
// convertProposalToProject, so a signed proposal gets the same head start.
export async function applyProjectTemplate(
  prisma: PrismaClient,
  projectId: string,
  templateKey: string | undefined | null,
  startDate: Date = new Date()
) {
  const template = getProjectTemplate(templateKey ?? undefined);
  if (!template) return;

  await prisma.projectTask.createMany({
    data: template.tasks.map((t) => ({ projectId, title: t.title, priority: t.priority })),
  });

  await prisma.projectMilestone.createMany({
    data: template.milestones.map((m) => ({
      projectId,
      title: m.title,
      dueAt: new Date(startDate.getTime() + m.daysFromStart * 86400000),
    })),
  });
}
