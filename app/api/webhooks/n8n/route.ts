import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret } from "@/lib/integrations/webhook-auth";
import { n8nLeadPayloadSchema } from "@/lib/validation/lead";
import { ingestN8nLead } from "@/lib/integrations/ingest";

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

  const leadId = await ingestN8nLead(parsed.data);
  return NextResponse.json({ ok: true, leadId }, { status: 200 });
}
