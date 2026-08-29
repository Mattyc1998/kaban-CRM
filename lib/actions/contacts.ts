"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateCompany } from "@/lib/contacts-linking";
import { uploadEmailAttachment } from "@/lib/integrations/blob-storage";
import {
  createCompanySchema,
  updateCompanySchema,
  deleteCompanySchema,
  createContactPersonSchema,
  updateContactPersonSchema,
  deleteContactPersonSchema,
  linkProjectSchema,
  unlinkProjectSchema,
  addEmailLogSchema,
  deleteEmailLogSchema,
} from "@/lib/validation/contact";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function revalidateContacts() {
  revalidatePath("/contacts");
  revalidatePath("/projects");
}

const PROJECT_MONEY_SELECT = {
  id: true,
  name: true,
  stage: true,
  budget: true,
  portalSlug: true,
  retainerAmount: true,
  retainerActive: true,
} as const;

const COMPANY_INCLUDE = {
  contacts: { orderBy: { createdAt: "asc" as const } },
  projects: {
    select: PROJECT_MONEY_SELECT,
    orderBy: { createdAt: "desc" as const },
  },
  leads: {
    select: { id: true, name: true, stage: true },
    orderBy: { createdAt: "desc" as const },
  },
  emailLogs: {
    orderBy: { contactedAt: "desc" as const },
    include: { attachments: true },
  },
};

export async function listCompanies() {
  await requireSession();
  return prisma.company.findMany({
    orderBy: { name: "asc" },
    include: COMPANY_INCLUDE,
  });
}

export async function getCompanyDetail(id: string) {
  await requireSession();
  return prisma.company.findUniqueOrThrow({
    where: { id },
    include: COMPANY_INCLUDE,
  });
}

// One-off sync for data that predates the Company/Contact model (or was
// created before auto-linking existed): links any Lead/Project with client
// info but no companyId yet. Safe to run repeatedly — dedupes the same way
// createLead/createProject do.
export async function syncExistingContacts() {
  await requireSession();

  const [leads, projects] = await Promise.all([
    prisma.lead.findMany({ where: { companyId: null } }),
    prisma.project.findMany({ where: { companyId: null } }),
  ]);

  let linked = 0;

  for (const lead of leads) {
    if (!lead.name && !lead.email && !lead.company) continue;
    const companyId = await findOrCreateCompany({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
    });
    if (companyId) {
      await prisma.lead.update({ where: { id: lead.id }, data: { companyId } });
      linked++;
    }
  }

  for (const project of projects) {
    if (!project.clientName && !project.clientEmail && !project.clientCompany) continue;
    const companyId = await findOrCreateCompany({
      name: project.clientName,
      email: project.clientEmail,
      company: project.clientCompany,
    });
    if (companyId) {
      await prisma.project.update({ where: { id: project.id }, data: { companyId } });
      linked++;
    }
  }

  revalidateContacts();
  return { linked };
}

export async function listUnlinkedProjects() {
  await requireSession();
  return prisma.project.findMany({
    where: { companyId: null },
    select: { id: true, name: true, clientName: true, clientCompany: true },
    orderBy: { name: "asc" },
  });
}

export async function createCompany(input: unknown) {
  await requireSession();
  const data = createCompanySchema.parse(input);

  const company = await prisma.company.create({
    data: { name: data.name, notes: data.notes || null },
  });

  revalidateContacts();
  return company;
}

export async function updateCompany(input: unknown) {
  await requireSession();
  const data = updateCompanySchema.parse(input);

  await prisma.company.update({
    where: { id: data.id },
    data: { name: data.name, notes: data.notes || null },
  });

  revalidateContacts();
}

// Contacts (people) and the email log cascade-delete with the company;
// linked Projects/Leads/Proposals just get unlinked (companyId set to
// null), not deleted — they're real business records, not owned by the
// contact.
export async function deleteCompany(input: unknown) {
  await requireSession();
  const data = deleteCompanySchema.parse(input);

  await prisma.company.delete({ where: { id: data.id } });

  revalidateContacts();
}

export async function addContactPerson(input: unknown) {
  await requireSession();
  const data = createContactPersonSchema.parse(input);

  await prisma.contact.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || null,
    },
  });

  revalidateContacts();
}

export async function updateContactPerson(input: unknown) {
  await requireSession();
  const data = updateContactPersonSchema.parse(input);

  await prisma.contact.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || null,
    },
  });

  revalidateContacts();
}

export async function deleteContactPerson(input: unknown) {
  await requireSession();
  const data = deleteContactPersonSchema.parse(input);

  await prisma.contact.delete({ where: { id: data.id } });

  revalidateContacts();
}

export async function linkProjectToContact(input: unknown) {
  await requireSession();
  const data = linkProjectSchema.parse(input);

  await prisma.project.update({
    where: { id: data.projectId },
    data: { companyId: data.companyId },
  });

  revalidateContacts();
}

export async function unlinkProjectFromContact(input: unknown) {
  await requireSession();
  const data = unlinkProjectSchema.parse(input);

  await prisma.project.update({
    where: { id: data.projectId },
    data: { companyId: null },
  });

  revalidateContacts();
}

// FormData, not a plain object, since attachments require multipart —
// mirrors uploadProjectFileAction in lib/actions/projects.ts.
export async function addEmailLog(formData: FormData) {
  await requireSession();
  const data = addEmailLogSchema.parse({
    companyId: formData.get("companyId"),
    direction: formData.get("direction"),
    subject: formData.get("subject"),
    summary: formData.get("summary"),
  });

  const emailLog = await prisma.emailLog.create({
    data: {
      companyId: data.companyId,
      direction: data.direction,
      subject: data.subject,
      summary: data.summary,
      contactedAt: data.contactedAt ?? new Date(),
    },
  });

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const uploaded = await uploadEmailAttachment(data.companyId, file);
    await prisma.emailAttachment.create({
      data: { emailLogId: emailLog.id, url: uploaded.url, name: uploaded.name },
    });
  }

  revalidateContacts();
}

export async function deleteEmailLog(input: unknown) {
  await requireSession();
  const data = deleteEmailLogSchema.parse(input);

  await prisma.emailLog.delete({ where: { id: data.id } });

  revalidateContacts();
}
