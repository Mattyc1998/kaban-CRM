import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProposalView } from "@/components/proposals/proposal-view";

async function getProposal(slug: string) {
  return prisma.proposal.findUnique({ where: { publicSlug: slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const proposal = await getProposal(slug);
  if (!proposal) return { title: "ClearFlow AI Proposal" };
  return { title: `${proposal.title} — Proposal` };
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await getProposal(slug);

  if (!proposal) notFound();

  return <ProposalView proposal={proposal} />;
}
