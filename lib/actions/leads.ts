"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runLeadResearch } from "@/lib/integrations/ai-research";
import { findOrCreateContact } from "@/lib/contacts-linking";
import {
  createLeadSchema,
  updateLeadSchema,
  moveLeadSchema,
  addNoteSchema,
} from "@/lib/validation/lead";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createLead(input: unknown) {
  await requireSession();
  const data = createLeadSchema.parse(input);

  const last = await prisma.lead.findFirst({
    where: { stage: "INTERESTED" },
    orderBy: { position: "desc" },
  });

  const contactId = await findOrCreateContact({
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone,
  });

  await prisma.lead.create({
    data: {
      name: data.name,
      company: data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      dealValue: data.dealValue,
      contactId,
      stage: "INTERESTED",
      source: "MANUAL",
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/");
}

export async function updateLead(input: unknown) {
  await requireSession();
  const data = updateLeadSchema.parse(input);
  const { id, ...rest } = data;

  await prisma.lead.update({
    where: { id },
    data: {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.company !== undefined && { company: rest.company || null }),
      ...(rest.email !== undefined && { email: rest.email || null }),
      ...(rest.phone !== undefined && { phone: rest.phone || null }),
    },
  });

  revalidatePath("/leads");
}

export async function moveLead(input: unknown) {
  await requireSession();
  const data = moveLeadSchema.parse(input);

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: data.id } });
  const stageChanged = lead.stage !== data.stage;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: data.id },
      data: { stage: data.stage, position: data.position },
    }),
    ...(stageChanged
      ? [
          prisma.leadActivity.create({
            data: {
              leadId: data.id,
              type: "STAGE_CHANGE",
              content: `Moved from ${lead.stage} to ${data.stage}`,
            },
          }),
        ]
      : []),
  ]);

  revalidatePath("/leads");
  revalidatePath("/");
}

export async function addNote(input: unknown) {
  await requireSession();
  const data = addNoteSchema.parse(input);

  await prisma.leadActivity.create({
    data: { leadId: data.leadId, type: "NOTE", content: data.content },
  });

  revalidatePath("/leads");
}

export async function triggerResearch(leadId: string) {
  await requireSession();
  await runLeadResearch(leadId);
  revalidatePath("/leads");
}

export async function getLeadActivities(leadId: string) {
  await requireSession();
  return prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteLead(leadId: string) {
  await requireSession();
  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
  revalidatePath("/");
}
