"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCopilotTurn } from "@/lib/copilot/core";
import { XaiNotConfiguredError } from "@/lib/integrations/xai";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function getCopilotHistory() {
  await requireSession();
  const messages = await prisma.copilotMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return messages;
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
