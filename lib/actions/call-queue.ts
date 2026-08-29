"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  importCallQueueSchema,
  rescheduleCallQueueSchema,
  markCalledSchema,
  deleteCallQueueLeadSchema,
} from "@/lib/validation/call-queue";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

// Cadence steps a lead advances through on each call; matches the original
// cold-calling tracker spec exactly.
const SEQUENCE = [1, 3, 5, 7];

export async function listCallQueueLeads() {
  await requireSession();
  return prisma.callQueueLead.findMany({ orderBy: { nextCallDate: "asc" } });
}

// A CSV import replaces the whole queue — matches how a cold-call list is
// normally refreshed (a fresh export replaces the old one, not merged).
export async function importCallQueueLeads(input: unknown) {
  await requireSession();

  const parsed = importCallQueueSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const rowNum = typeof issue.path[0] === "number" ? issue.path[0] + 1 : "?";
    const field = issue.path[1] ?? "row";
    throw new Error(`CSV row ${rowNum}, "${String(field)}": ${issue.message}`);
  }
  const rows = parsed.data;

  await prisma.$transaction([
    prisma.callQueueLead.deleteMany({}),
    prisma.callQueueLead.createMany({
      data: rows.map((r) => ({
        leadName: r.leadName,
        company: r.company || null,
        phone: r.phone || null,
        email: r.email || null,
        sequenceDay: r.sequenceDay,
        nextCallDate: r.nextCallDate,
        status: r.status,
        source: r.source || null,
      })),
    }),
  ]);

  revalidatePath("/call-queue");
  return { imported: rows.length };
}

export async function markCalled(input: unknown) {
  await requireSession();
  const data = markCalledSchema.parse(input);

  const lead = await prisma.callQueueLead.findUniqueOrThrow({ where: { id: data.id } });
  const currentIndex = SEQUENCE.indexOf(lead.sequenceDay);

  if (currentIndex >= 0 && currentIndex < SEQUENCE.length - 1) {
    const nextCallDate = new Date();
    nextCallDate.setDate(nextCallDate.getDate() + 2);
    await prisma.callQueueLead.update({
      where: { id: data.id },
      data: { sequenceDay: SEQUENCE[currentIndex + 1], nextCallDate, status: "ACTIVE" },
    });
  } else {
    await prisma.callQueueLead.update({ where: { id: data.id }, data: { status: "COMPLETE" } });
  }

  revalidatePath("/call-queue");
}

export async function rescheduleCallQueueLead(input: unknown) {
  await requireSession();
  const data = rescheduleCallQueueSchema.parse(input);

  await prisma.callQueueLead.update({
    where: { id: data.id },
    data: { nextCallDate: data.nextCallDate },
  });

  revalidatePath("/call-queue");
}

export async function deleteCallQueueLead(input: unknown) {
  await requireSession();
  const data = deleteCallQueueLeadSchema.parse(input);

  await prisma.callQueueLead.delete({ where: { id: data.id } });

  revalidatePath("/call-queue");
}
