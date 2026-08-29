import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ProposalDocument } from "@/lib/pdf/proposal-document";

// No auth — gated only by the unguessable publicSlug, same access model as
// /proposal/[slug] itself (see proxy.ts, which already excludes /api/* from
// the login redirect).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { publicSlug: slug } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(ProposalDocument({ proposal }));
  const filename = `${proposal.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-proposal.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
