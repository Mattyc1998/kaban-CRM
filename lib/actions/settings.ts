"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/integrations/settings-store";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

const telegramConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  chatId: z.string().min(1, "Chat ID is required"),
});

export async function saveTelegramConfig(input: unknown) {
  await requireSession();
  const data = telegramConfigSchema.parse(input);

  await setSetting("TELEGRAM_BOT_TOKEN", data.botToken);
  await setSetting("TELEGRAM_CHAT_ID", data.chatId);

  revalidatePath("/webhooks");
}

// Registers our webhook route with Telegram's Bot API so it starts pushing
// messages to us instead of needing the local long-polling script.
export async function enableTelegramWebhook(): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  const botToken = await getSetting("TELEGRAM_BOT_TOKEN");
  if (!botToken) return { ok: false, error: "Save a bot token first." };

  let webhookSecret = await getSetting("TELEGRAM_WEBHOOK_SECRET");
  if (!webhookSecret) {
    webhookSecret = randomBytes(24).toString("hex");
    await setSetting("TELEGRAM_WEBHOOK_SECRET", webhookSecret);
  }

  const host = (await headers()).get("host");
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const webhookUrl = `${proto}://${host}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, secret_token: webhookSecret }),
  });

  const json = await res.json();
  if (!res.ok || !json.ok) {
    return { ok: false, error: json.description ?? `Telegram API error ${res.status}` };
  }

  await setSetting("TELEGRAM_WEBHOOK_ENABLED", "true");
  revalidatePath("/webhooks");
  return { ok: true };
}
