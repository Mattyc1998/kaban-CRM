import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { runLeadResearch } from "@/lib/integrations/ai-research";
import type { z } from "zod";
import type { n8nLeadPayloadSchema, instantlyReplyPayloadSchema } from "@/lib/validation/lead";

type N8nLeadPayload = z.infer<typeof n8nLeadPayloadSchema>;
type InstantlyReplyPayload = z.infer<typeof instantlyReplyPayloadSchema>;

// Shared by app/api/webhooks/n8n/route.ts and the in-app webhook simulator
// (lib/actions/webhooks.ts) so both paths run the exact same ingestion logic.
export async function ingestN8nLead(data: N8nLeadPayload) {
  const stage = data.stage ?? "INTERESTED";

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
        dealValue: data.dealValue ?? existing.dealValue,
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
        dealValue: data.dealValue,
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

  return leadId;
}

// Shared by app/api/webhooks/instantly/route.ts and the in-app webhook
// simulator (lib/actions/webhooks.ts).
export async function ingestInstantlyReply(data: InstantlyReplyPayload) {
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
      data: { stage: "INTERESTED", externalId: data.externalId ?? existing.externalId },
    });
    leadId = updated.id;
  } else {
    const last = await prisma.lead.findFirst({
      where: { stage: "INTERESTED" },
      orderBy: { position: "desc" },
    });

    const created = await prisma.lead.create({
      data: {
        name: data.name || data.email,
        company: data.company,
        email: data.email,
        externalId: data.externalId,
        source: "INSTANTLY",
        stage: "INTERESTED",
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

  return leadId;
}
