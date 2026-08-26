"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateEnvFile } from "@/lib/integrations/env-file";
import { z } from "zod";

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

  await updateEnvFile({
    TELEGRAM_BOT_TOKEN: data.botToken,
    TELEGRAM_CHAT_ID: data.chatId,
  });

  revalidatePath("/webhooks");
}
