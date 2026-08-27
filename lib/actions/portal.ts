"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadProjectFile } from "@/lib/integrations/blob-storage";
import {
  addChangeRequestPortalSchema,
  addCommentPortalSchema,
  uploadMediaPortalSchema,
  approveDeliverablePortalSchema,
} from "@/lib/validation/portal";

// No auth here — access to a project is gated by knowing its unguessable
// portalSlug, the same model the plan uses until real Customer login ships.

export async function submitChangeRequest(input: unknown) {
  const data = addChangeRequestPortalSchema.parse(input);

  const project = await prisma.project.findUniqueOrThrow({
    where: { portalSlug: data.slug },
  });

  await prisma.projectChangeRequest.create({
    data: { projectId: project.id, content: data.content },
  });

  revalidatePath(`/portal/${data.slug}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function submitPortalComment(input: unknown) {
  const data = addCommentPortalSchema.parse(input);

  const project = await prisma.project.findUniqueOrThrow({
    where: { portalSlug: data.slug },
  });

  await prisma.projectComment.create({
    data: { projectId: project.id, author: data.author, content: data.content },
  });

  revalidatePath(`/portal/${data.slug}`);
  revalidatePath("/projects");
}

export async function uploadPortalMedia(formData: FormData) {
  const data = uploadMediaPortalSchema.parse({
    slug: formData.get("slug"),
    uploadedBy: formData.get("uploadedBy"),
  });
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: { portalSlug: data.slug },
  });

  const uploaded = await uploadProjectFile(project.id, file);

  await prisma.projectFile.create({
    data: {
      projectId: project.id,
      kind: "MEDIA",
      url: uploaded.url,
      name: uploaded.name,
      uploadedBy: data.uploadedBy,
    },
  });

  revalidatePath(`/portal/${data.slug}`);
  revalidatePath("/projects");
}

export async function approvePortalDeliverable(input: unknown) {
  const data = approveDeliverablePortalSchema.parse(input);

  const file = await prisma.projectFile.findUniqueOrThrow({ where: { id: data.fileId } });
  const project = await prisma.project.findUniqueOrThrow({ where: { id: file.projectId } });
  if (project.portalSlug !== data.slug) throw new Error("Not found");

  await prisma.projectFile.update({
    where: { id: data.fileId },
    data: { status: "APPROVED" },
  });

  revalidatePath(`/portal/${data.slug}`);
  revalidatePath("/projects");
}
