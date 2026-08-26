"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortalSlug } from "@/lib/integrations/portal";
import {
  createProjectSchema,
  moveProjectSchema,
  updateProgressSchema,
  addTaskSchema,
  toggleTaskSchema,
  deleteTaskSchema,
  addCommentSchema,
  resolveChangeRequestSchema,
  addDeliverableSchema,
  projectStages,
} from "@/lib/validation/project";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

function revalidateProjects() {
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function createProject(input: unknown) {
  await requireSession();
  const data = createProjectSchema.parse(input);

  const last = await prisma.project.findFirst({
    where: { stage: "ONBOARDING" },
    orderBy: { position: "desc" },
  });

  const project = await prisma.project.create({
    data: {
      name: data.name,
      clientName: data.clientName || null,
      clientEmail: data.clientEmail || null,
      budget: data.budget,
      leadId: data.leadId || null,
      portalSlug: generatePortalSlug(data.name),
      stage: "ONBOARDING",
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidateProjects();
  return project;
}

export async function moveProject(input: unknown) {
  await requireSession();
  const data = moveProjectSchema.parse(input);

  await prisma.project.update({
    where: { id: data.id },
    data: { stage: data.stage, position: data.position },
  });

  revalidateProjects();
}

// Used by the stage <Select> in the project detail modal, where we don't
// have sibling positions on hand (unlike drag-and-drop's moveProject).
export async function setProjectStage(id: string, stage: (typeof projectStages)[number]) {
  await requireSession();

  const last = await prisma.project.findFirst({
    where: { stage },
    orderBy: { position: "desc" },
  });

  await prisma.project.update({
    where: { id },
    data: { stage, position: (last?.position ?? -1) + 1 },
  });

  revalidateProjects();
}

export async function updateProgress(input: unknown) {
  await requireSession();
  const data = updateProgressSchema.parse(input);

  await prisma.project.update({
    where: { id: data.id },
    data: { progress: data.progress },
  });

  revalidateProjects();
}

export async function addTask(input: unknown) {
  await requireSession();
  const data = addTaskSchema.parse(input);

  await prisma.projectTask.create({
    data: { projectId: data.projectId, title: data.title, priority: data.priority },
  });

  revalidateProjects();
}

export async function toggleTask(input: unknown) {
  await requireSession();
  const data = toggleTaskSchema.parse(input);

  await prisma.projectTask.update({
    where: { id: data.taskId },
    data: { done: data.done },
  });

  revalidateProjects();
}

export async function deleteTask(input: unknown) {
  await requireSession();
  const data = deleteTaskSchema.parse(input);

  await prisma.projectTask.delete({ where: { id: data.taskId } });
  revalidateProjects();
}

export async function addComment(input: unknown) {
  const session = await requireSession();
  const data = addCommentSchema.parse({
    ...(input as object),
    author: (input as { author?: string })?.author || session.user?.name || "Admin",
  });

  await prisma.projectComment.create({
    data: { projectId: data.projectId, author: data.author, content: data.content },
  });

  revalidateProjects();
}

export async function resolveChangeRequest(input: unknown) {
  await requireSession();
  const data = resolveChangeRequestSchema.parse(input);

  await prisma.projectChangeRequest.update({
    where: { id: data.changeRequestId },
    data: { status: "RESOLVED" },
  });

  revalidateProjects();
}

export async function addDeliverable(input: unknown) {
  await requireSession();
  const data = addDeliverableSchema.parse(input);

  await prisma.projectFile.create({
    data: { projectId: data.projectId, name: data.name, url: data.url },
  });

  revalidateProjects();
}

export async function getProjectDetail(projectId: string) {
  await requireSession();
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      files: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "desc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}
