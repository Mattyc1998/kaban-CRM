"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateCompany } from "@/lib/contacts-linking";
import {
  importCallQueueSchema,
  rescheduleCallQueueSchema,
  markCalledSchema,
  deleteCallQueueLeadSchema,
  convertCallQueueLeadSchema,
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
        placeId: r.placeId || null,
        address: r.address || null,
        website: r.website || null,
        rating: r.rating ?? null,
        reviews: r.reviews ?? null,
      })),
    }),
  ]);

  revalidatePath("/call-queue");
  return { imported: rows.length };
}

export async function markCalled(input: unknown) {
  await requireSession();
  const data = markCalledSchema.parse(input);

  if (data.outcome === "NOT_INTERESTED") {
    // Skip the rest of the cadence outright — no point calling again in 2
    // days if they've already said no.
    await prisma.callQueueLead.update({ where: { id: data.id }, data: { status: "COMPLETE" } });
    revalidatePath("/call-queue");
    return;
  }

  // NO_ANSWER — advance the 1 -> 3 -> 5 -> 7 cadence, same as before.
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

// Called when a Call Queue outcome is "Interested" — the whole point of the
// cadence is to get here, so this is where a cold-call name actually
// becomes a real Lead (and Company/Contact) in the sales pipeline, instead
// of the call queue being a dead end that never talks to the rest of the
// CRM.
export async function convertCallQueueLeadToLead(input: unknown) {
  await requireSession();
  const data = convertCallQueueLeadSchema.parse(input);

  const callLead = await prisma.callQueueLead.findUniqueOrThrow({ where: { id: data.id } });

  const companyId = await findOrCreateCompany({
    name: callLead.leadName,
    email: callLead.email,
    phone: callLead.phone,
  });

  const last = await prisma.lead.findFirst({
    where: { stage: "INTERESTED" },
    orderBy: { position: "desc" },
  });

  const context = [
    callLead.address && `Address: ${callLead.address}`,
    callLead.website && `Website: ${callLead.website}`,
    callLead.rating != null &&
      `Rating: ${callLead.rating}${callLead.reviews != null ? ` (${callLead.reviews} reviews)` : ""}`,
  ].filter(Boolean);

  const lead = await prisma.lead.create({
    data: {
      name: callLead.leadName,
      email: callLead.email,
      phone: callLead.phone,
      companyId,
      stage: "INTERESTED",
      source: "MANUAL",
      position: (last?.position ?? -1) + 1,
      aiSummary: context.length > 0 ? `Cold-called via Call Queue. ${context.join(". ")}.` : null,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "NOTE",
      content: `Converted from Call Queue after a call marked "Interested".`,
    },
  });

  // Keeps the call queue record around as history (same as day-7
  // exhaustion) rather than deleting it, but pulls it out of the active
  // due list.
  await prisma.callQueueLead.update({ where: { id: data.id }, data: { status: "COMPLETE" } });

  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/call-queue");

  return lead;
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
