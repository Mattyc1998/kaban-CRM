"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCopilotTurn, COPILOT_RESET_KEY } from "@/lib/copilot/core";
import { XaiNotConfiguredError } from "@/lib/integrations/xai";
import { getSetting, setSetting } from "@/lib/integrations/settings-store";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function getCopilotHistory() {
  await requireSession();
  const resetAt = await getSetting(COPILOT_RESET_KEY);
  const messages = await prisma.copilotMessage.findMany({
    where: resetAt ? { createdAt: { gt: new Date(resetAt) } } : undefined,
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return messages;
}

// "New Chat" — moves the reset cursor forward so older messages (this web
// session's and Telegram's, which share one conversation) drop out of
// context, without deleting them.
export async function resetCopilotConversation() {
  await requireSession();
  await setSetting(COPILOT_RESET_KEY, new Date().toISOString());
}

export async function sendCopilotMessage(content: string): Promise<{ reply: string }> {
  await requireSession();
  try {
    const reply = await runCopilotTurn("WEB", content);
    return { reply };
  } catch (err) {
    if (err instanceof XaiNotConfiguredError) {
      return {
        reply:
          "ClearFlow Copilot isn't configured yet — add XAI_API_KEY to your .env and restart the dev server.",
      };
    }
    throw err;
  }
}
