"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { n8nLeadPayloadSchema, instantlyReplyPayloadSchema } from "@/lib/validation/lead";
import { ingestN8nLead, ingestInstantlyReply } from "@/lib/integrations/ingest";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

// Drives the exact same ingestion code the real /api/webhooks/n8n and
// /api/webhooks/instantly endpoints use, so "simulating" a webhook here
// proves the real integration works — it's not a separate mock path.
export async function simulateWebhook(
  source: "N8N" | "INSTANTLY",
  input: unknown
): Promise<{ leadId: string }> {
  await requireSession();

  let leadId: string;
  if (source === "N8N") {
    leadId = await ingestN8nLead(n8nLeadPayloadSchema.parse(input));
  } else {
    leadId = await ingestInstantlyReply(instantlyReplyPayloadSchema.parse(input));
  }

  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/webhooks");
  return { leadId };
}
