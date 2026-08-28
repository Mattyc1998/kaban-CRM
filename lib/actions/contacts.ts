"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    },
  });
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
