import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/integrations/webhook-auth";
import { n8nLeadPayloadSchema } from "@/lib/validation/lead";

// Point an n8n HTTP Request node at this endpoint to create/update leads.
// Auth: header `x-webhook-secret` must match N8N_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const unauthorized = verifyWebhookSecret(req, "N8N_WEBHOOK_SECRET");
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = n8nLeadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const stage = data.stage ?? "COLD_LEAD";

  const existing = await prisma.lead.findFirst({
    where: {
      source: "N8N",
      OR: [
        ...(data.externalId ? [{ externalId: data.externalId }] : []),
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  let leadId: string;

  if (existing) {
    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        company: data.company ?? existing.company,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        externalId: data.externalId ?? existing.externalId,
      },
    });
    leadId = updated.id;
  } else {
    const last = await prisma.lead.findFirst({
      where: { stage },
      orderBy: { position: "desc" },
    });

    const created = await prisma.lead.create({
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        externalId: data.externalId,
        source: "N8N",
        stage,
        position: (last?.position ?? -1) + 1,
      },
    });
    leadId = created.id;
  }

  if (data.note) {
    await prisma.leadActivity.create({
      data: { leadId, type: "NOTE", content: data.note },
    });
  }

  return NextResponse.json({ ok: true, leadId }, { status: 200 });
}
