import { getSetting } from "@/lib/integrations/settings-store";

export async function sendTelegramNotification(message: string): Promise<void> {
  const token = await getSetting("TELEGRAM_BOT_TOKEN");
  const chatId = await getSetting("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    console.log(`[telegram:stub] would send: ${message}`);
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!res.ok) {
    console.error(`[telegram] send failed: ${res.status} ${await res.text()}`);
  }
}
