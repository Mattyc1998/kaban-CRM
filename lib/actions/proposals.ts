"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortalSlug } from "@/lib/integrations/portal";
import { findOrCreateCompany } from "@/lib/contacts-linking";
import { applyProjectTemplate } from "@/lib/project-templates";
import {
  createProposalSchema,
  updateProposalSchema,
  markProposalSentSchema,
  convertProposalSchema,
} from "@/lib/validation/proposal";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

function revalidateProposals() {
  revalidatePath("/proposals");
  revalidatePath("/contacts");
}

export async function listProposals() {
  await requireSession();
  return prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: { select: { id: true, name: true } } },
  });
}

export async function getProposalDetail(id: string) {
  await requireSession();
  return prisma.proposal.findUniqueOrThrow({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, portalSlug: true } },
    },
  });
}

export async function createProposal(input: unknown) {
  await requireSession();
  const data = createProposalSchema.parse(input);

  const proposal = await prisma.proposal.create({
    data: {
      title: data.title,
      companyId: data.companyId || null,
      clientName: data.clientName || null,
      clientCompany: data.clientCompany || null,
      clientEmail: data.clientEmail || null,
      scope: data.scope,
      price: data.price,
      publicSlug: generatePortalSlug(data.title),
    },
  });

  revalidateProposals();
  return proposal;
}

export async function updateProposal(input: unknown) {
  await requireSession();
  const data = updateProposalSchema.parse(input);

  const existing = await prisma.proposal.findUniqueOrThrow({ where: { id: data.id } });
  if (existing.status === "SIGNED" || existing.status === "DECLINED") {
    throw new Error("Cannot edit a proposal that's already been signed or declined");
  }

  await prisma.proposal.update({
    where: { id: data.id },
    data: {
      title: data.title,
      companyId: data.companyId || null,
      clientName: data.clientName || null,
      clientCompany: data.clientCompany || null,
      clientEmail: data.clientEmail || null,
      scope: data.scope,
      price: data.price,
    },
  });

  revalidateProposals();
}

export async function markProposalSent(input: unknown) {
  await requireSession();
  const data = markProposalSentSchema.parse(input);

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: data.id } });
  if (proposal.status !== "DRAFT") return;

  await prisma.proposal.update({ where: { id: data.id }, data: { status: "SENT" } });
  revalidateProposals();
}

export async function convertProposalToProject(input: unknown) {
  await requireSession();
  const data = convertProposalSchema.parse(input);

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: data.proposalId } });
  if (proposal.status !== "SIGNED") {
    throw new Error("Only a signed proposal can be converted to a project");
  }
  if (proposal.projectId) {
    throw new Error("This proposal has already been converted to a project");
  }

  const last = await prisma.project.findFirst({
    where: { stage: "ONBOARDING" },
    orderBy: { position: "desc" },
  });

  const companyId =
    proposal.companyId ||
    (await findOrCreateCompany({
      name: proposal.clientName,
      email: proposal.clientEmail,
      company: proposal.clientCompany,
    }));

  const project = await prisma.project.create({
    data: {
      name: proposal.title,
      clientName: proposal.clientName,
      clientCompany: proposal.clientCompany,
      clientEmail: proposal.clientEmail,
      budget: proposal.price,
      companyId,
      portalSlug: generatePortalSlug(proposal.title),
      stage: "ONBOARDING",
      position: (last?.position ?? -1) + 1,
    },
  });

  await prisma.projectComment.create({
    data: {
      projectId: project.id,
      author: "System",
      content: `Project created from a signed proposal (accepted by ${proposal.signedName} on ${proposal.signedAt?.toLocaleDateString("en-GB")}). Portal link generated.`,
    },
  });

  await applyProjectTemplate(prisma, project.id, data.templateKey);

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { projectId: project.id },
  });

  revalidateProposals();
  revalidatePath("/projects");
  revalidatePath("/");
  return project;
}
