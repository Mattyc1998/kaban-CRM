import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret } from "@/lib/integrations/webhook-auth";
import { instantlyReplyPayloadSchema } from "@/lib/validation/lead";
import { ingestInstantlyReply } from "@/lib/integrations/ingest";

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

  const leadId = await ingestInstantlyReply(parsed.data);
  return NextResponse.json({ ok: true, leadId }, { status: 200 });
}
