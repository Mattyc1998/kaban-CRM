"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortalSlug } from "@/lib/integrations/portal";
import { uploadProjectFile } from "@/lib/integrations/blob-storage";
import { findOrCreateCompany } from "@/lib/contacts-linking";
import { applyProjectTemplate } from "@/lib/project-templates";
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
  addMilestoneSchema,
  toggleMilestoneSchema,
  deleteMilestoneSchema,
  updatePreviewUrlSchema,
  updateRetainerSchema,
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

  const lead = data.leadId
    ? await prisma.lead.findUnique({ where: { id: data.leadId } })
    : null;

  // If this project is converting a lead that's already linked to a
  // Company, reuse that exact company rather than re-deriving one from the
  // freeform client fields typed into this form — avoids creating a
  // duplicate when the company name gets typed slightly differently.
  const companyId =
    lead?.companyId ??
    (await findOrCreateCompany({
      name: data.clientName,
      email: data.clientEmail,
      company: data.clientCompany,
    }));

  const project = await prisma.project.create({
    data: {
      name: data.name,
      clientName: data.clientName || null,
      clientCompany: data.clientCompany || null,
      clientEmail: data.clientEmail || null,
      budget: data.budget,
      leadId: data.leadId || null,
      companyId,
      portalSlug: generatePortalSlug(data.name),
      stage: "ONBOARDING",
      position: (last?.position ?? -1) + 1,
    },
  });

  // Logged into Direct Project Messages so the creation event (and the
  // fact a portal link now exists) is visible in the same thread the
  // client sees, not just buried in an admin-only audit trail.
  await prisma.projectComment.create({
    data: {
      projectId: project.id,
      author: "System",
      content: lead
        ? `Project automatically created from Won Lead "${lead.name}"${
            lead.dealValue ? ` (£${lead.dealValue.toLocaleString()})` : ""
          }. Portal link generated.`
        : `Project created. Portal link generated.`,
    },
  });

  await applyProjectTemplate(prisma, project.id, data.templateKey);

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

export async function updatePreviewUrl(input: unknown) {
  await requireSession();
  const data = updatePreviewUrlSchema.parse(input);

  await prisma.project.update({
    where: { id: data.id },
    data: { previewUrl: data.previewUrl || null },
  });

  revalidateProjects();
}

export async function updateRetainer(input: unknown) {
  await requireSession();
  const data = updateRetainerSchema.parse(input);

  await prisma.project.update({
    where: { id: data.id },
    data: {
      retainerAmount: data.retainerAmount,
      retainerActive: data.retainerActive,
    },
  });

  revalidateProjects();
  revalidatePath("/contacts");
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
    data: { projectId: data.projectId, name: data.name, url: data.url, kind: "DELIVERABLE" },
  });

  revalidateProjects();
}

// Admin-side file upload, used for both deliverables and media — mirrors
// the client-facing lib/actions/portal.ts#uploadPortalMedia.
export async function uploadProjectFileAction(formData: FormData) {
  await requireSession();

  const projectId = formData.get("projectId");
  const kind = formData.get("kind");
  const file = formData.get("file");
  if (typeof projectId !== "string" || !projectId) throw new Error("Missing projectId");
  if (kind !== "DELIVERABLE" && kind !== "MEDIA") throw new Error("Invalid kind");
  if (!(file instanceof File) || file.size === 0) throw new Error("No file provided");

  const uploaded = await uploadProjectFile(projectId, file);

  await prisma.projectFile.create({
    data: { projectId, kind, url: uploaded.url, name: uploaded.name, uploadedBy: "admin" },
  });

  revalidateProjects();
}

export async function addMilestone(input: unknown) {
  await requireSession();
  const data = addMilestoneSchema.parse(input);

  await prisma.projectMilestone.create({
    data: { projectId: data.projectId, title: data.title, dueAt: data.dueAt },
  });

  revalidateProjects();
}

export async function toggleMilestone(input: unknown) {
  await requireSession();
  const data = toggleMilestoneSchema.parse(input);

  await prisma.projectMilestone.update({
    where: { id: data.milestoneId },
    data: { completed: data.completed },
  });

  revalidateProjects();
}

export async function deleteMilestone(input: unknown) {
  await requireSession();
  const data = deleteMilestoneSchema.parse(input);

  await prisma.projectMilestone.delete({ where: { id: data.milestoneId } });
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
      milestones: { orderBy: { dueAt: "asc" } },
    },
  });
}
