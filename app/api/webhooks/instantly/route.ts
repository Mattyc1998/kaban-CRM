import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/integrations/webhook-auth";
import { instantlyReplyPayloadSchema } from "@/lib/validation/lead";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { runLeadResearch } from "@/lib/integrations/ai-research";

// Paste this endpoint's URL into Instantly.ai's webhook settings for the
// "reply received" event. Auth: header `x-webhook-secret` must match
// INSTANTLY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const unauthorized = verifyWebhookSecret(req, "INSTANTLY_WEBHOOK_SECRET");
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = instantlyReplyPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.lead.findFirst({
    where: {
      source: "INSTANTLY",
      OR: [
        ...(data.externalId ? [{ externalId: data.externalId }] : []),
        { email: data.email },
      ],
    },
  });

  let leadId: string;

  if (existing) {
    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: { stage: "REPLIED", externalId: data.externalId ?? existing.externalId },
    });
    leadId = updated.id;
  } else {
    const last = await prisma.lead.findFirst({
      where: { stage: "REPLIED" },
      orderBy: { position: "desc" },
    });

    const created = await prisma.lead.create({
      data: {
        name: data.name || data.email,
        company: data.company,
        email: data.email,
        externalId: data.externalId,
        source: "INSTANTLY",
        stage: "REPLIED",
        position: (last?.position ?? -1) + 1,
      },
    });
    leadId = created.id;
  }

  await prisma.leadActivity.create({
    data: { leadId, type: "REPLY", content: data.replyBody },
  });

  await sendTelegramNotification(
    `New reply from ${data.name || data.email} (${data.company || "unknown company"})`
  );
  await runLeadResearch(leadId);

  return NextResponse.json({ ok: true, leadId }, { status: 200 });
}
