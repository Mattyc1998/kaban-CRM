"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signProposalSchema, declineProposalSchema } from "@/lib/validation/proposal";

// No auth here — access is gated by knowing the unguessable publicSlug,
// same model as the client portal (lib/actions/portal.ts).

export async function signProposal(input: unknown) {
  const data = signProposalSchema.parse(input);

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { publicSlug: data.slug } });
  if (proposal.status === "SIGNED" || proposal.status === "DECLINED") {
    throw new Error("This proposal has already been responded to");
  }

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const signedIp = forwardedFor?.split(",")[0]?.trim();

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: "SIGNED", signedName: data.name, signedAt: new Date(), signedIp },
  });

  revalidatePath(`/proposal/${data.slug}`);
  revalidatePath("/proposals");
}

export async function declineProposal(input: unknown) {
  const data = declineProposalSchema.parse(input);

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { publicSlug: data.slug } });
  if (proposal.status === "SIGNED" || proposal.status === "DECLINED") {
    throw new Error("This proposal has already been responded to");
  }

  await prisma.proposal.update({ where: { id: proposal.id }, data: { status: "DECLINED" } });

  revalidatePath(`/proposal/${data.slug}`);
  revalidatePath("/proposals");
}
