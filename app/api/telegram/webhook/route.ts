import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/integrations/settings-store";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { runCopilotTurn } from "@/lib/copilot/core";

// Copilot tool calls (xAI round trips) can take a few seconds; give this
// route more headroom than Vercel's default function timeout.
export const maxDuration = 30;

type TelegramUpdate = {
  message?: { chat: { id: number }; text?: string };
};

// Registered with Telegram via lib/actions/settings.ts#enableTelegramWebhook.
// Auth: Telegram echoes back the secret_token we set on setWebhook in this
// header, so we can verify a request actually came from Telegram.
export async function POST(req: NextRequest) {
  const expectedSecret = await getSetting("TELEGRAM_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;

  // Always 200 back to Telegram even when we ignore a message, otherwise
  // it retries the same update repeatedly.
  if (!message?.text) return NextResponse.json({ ok: true });

  const configuredChatId = await getSetting("TELEGRAM_CHAT_ID");
  if (!configuredChatId || String(message.chat.id) !== String(configuredChatId)) {
    console.log(`[telegram-webhook] ignoring message from unconfigured chat ${message.chat.id}`);
    return NextResponse.json({ ok: true });
  }

  try {
    const reply = await runCopilotTurn("TELEGRAM", message.text);
    await sendTelegramNotification(reply);
  } catch (err) {
    console.error("[telegram-webhook] copilot turn failed:", err);
    await sendTelegramNotification("Sorry, something went wrong handling that.");
  }

  return NextResponse.json({ ok: true });
}
