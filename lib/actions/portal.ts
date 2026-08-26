"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addChangeRequestPortalSchema, addCommentPortalSchema } from "@/lib/validation/portal";

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
