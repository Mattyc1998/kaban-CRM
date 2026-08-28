"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateContact } from "@/lib/contacts-linking";
import { createContactSchema, updateContactSchema, linkProjectSchema, unlinkProjectSchema } from "@/lib/validation/contact";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function revalidateContacts() {
  revalidatePath("/contacts");
  revalidatePath("/projects");
}

export async function listContacts() {
  await requireSession();
  return prisma.contact.findMany({
    orderBy: { name: "asc" },
    include: {
      projects: {
        select: { id: true, name: true, stage: true, budget: true, portalSlug: true },
        orderBy: { createdAt: "desc" },
      },
      leads: {
        select: { id: true, name: true, stage: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getContactDetail(id: string) {
  await requireSession();
  return prisma.contact.findUniqueOrThrow({
    where: { id },
    include: {
      projects: {
        select: { id: true, name: true, stage: true, budget: true, portalSlug: true },
        orderBy: { createdAt: "desc" },
      },
      leads: {
        select: { id: true, name: true, stage: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// One-off sync for data that predates the Contact model (or was created
// before auto-linking existed): links any Lead/Project with client info
// but no contactId yet. Safe to run repeatedly — dedupes the same way
// createLead/createProject do.
export async function syncExistingContacts() {
  await requireSession();

  const [leads, projects] = await Promise.all([
    prisma.lead.findMany({ where: { contactId: null } }),
    prisma.project.findMany({ where: { contactId: null } }),
  ]);

  let linked = 0;

  for (const lead of leads) {
    if (!lead.name && !lead.email && !lead.company) continue;
    const contactId = await findOrCreateContact({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
    });
    if (contactId) {
      await prisma.lead.update({ where: { id: lead.id }, data: { contactId } });
      linked++;
    }
  }

  for (const project of projects) {
    if (!project.clientName && !project.clientEmail && !project.clientCompany) continue;
    const contactId = await findOrCreateContact({
      name: project.clientName,
      email: project.clientEmail,
      company: project.clientCompany,
    });
    if (contactId) {
      await prisma.project.update({ where: { id: project.id }, data: { contactId } });
      linked++;
    }
  }

  revalidateContacts();
  return { linked };
}

export async function listUnlinkedProjects() {
  await requireSession();
  return prisma.project.findMany({
    where: { contactId: null },
    select: { id: true, name: true, clientName: true, clientCompany: true },
    orderBy: { name: "asc" },
  });
}

export async function createContact(input: unknown) {
  await requireSession();
  const data = createContactSchema.parse(input);

  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
    },
  });

  revalidateContacts();
  return contact;
}

export async function updateContact(input: unknown) {
  await requireSession();
  const data = updateContactSchema.parse(input);

  await prisma.contact.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
    },
  });

  revalidateContacts();
}

export async function linkProjectToContact(input: unknown) {
  await requireSession();
  const data = linkProjectSchema.parse(input);

  await prisma.project.update({
    where: { id: data.projectId },
    data: { contactId: data.contactId },
  });

  revalidateContacts();
}

export async function unlinkProjectFromContact(input: unknown) {
  await requireSession();
  const data = unlinkProjectSchema.parse(input);

  await prisma.project.update({
    where: { id: data.projectId },
    data: { contactId: null },
  });

  revalidateContacts();
}
