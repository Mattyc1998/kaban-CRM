import { NextRequest, NextResponse } from "next/server";

// Verifies the `x-webhook-secret` header against the given env var.
// Returns a 401 NextResponse if the check fails, otherwise null.
export function verifyWebhookSecret(
  req: NextRequest,
  envVarName: "N8N_WEBHOOK_SECRET" | "INSTANTLY_WEBHOOK_SECRET"
): NextResponse | null {
  const expected = process.env[envVarName];
  const provided = req.headers.get("x-webhook-secret");

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
