import "dotenv/config";
import { runCopilotTurn } from "../lib/copilot/core";
import { getSetting } from "../lib/integrations/settings-store";

// Local-only alternative to the production webhook (app/api/telegram/webhook).
// Note: Telegram allows only one delivery mode per bot at a time — running
// this while the webhook is enabled (Webhooks & Settings page) will make
// Telegram reject getUpdates with a 409 Conflict. Use one or the other.

async function main() {
  const token = await getSetting("TELEGRAM_BOT_TOKEN");
  const chatId = await getSetting("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    console.error(
      "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set (Webhooks & Settings page, or .env) before running this script."
    );
    process.exit(1);
  }

  const API = `https://api.telegram.org/bot${token}`;

  async function sendReply(text: string) {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error(`[telegram-bot] send failed: ${res.status} ${await res.text()}`);
    }
  }

  type TelegramUpdate = {
    update_id: number;
    message?: { chat: { id: number }; text?: string };
  };

  let offset = 0;
  let running = true;

  process.on("SIGINT", () => {
    console.log("\n[telegram-bot] shutting down...");
    running = false;
    process.exit(0);
  });

  console.log(`[telegram-bot] listening for messages from chat ${chatId}... (Ctrl+C to stop)`);

  while (running) {
    try {
      const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`, {
        signal: AbortSignal.timeout(35_000),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[telegram-bot] getUpdates failed: ${res.status} ${body}`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      const { result } = (await res.json()) as { result: TelegramUpdate[] };

      for (const update of result) {
        offset = update.update_id + 1;
        const message = update.message;
        if (!message?.text) continue;
        if (String(message.chat.id) !== String(chatId)) {
          console.log(`[telegram-bot] ignoring message from unconfigured chat ${message.chat.id}`);
          continue;
        }

        console.log(`[telegram-bot] <- ${message.text}`);
        try {
          const reply = await runCopilotTurn("TELEGRAM", message.text);
          console.log(`[telegram-bot] -> ${reply}`);
          await sendReply(reply);
        } catch (err) {
          console.error("[telegram-bot] copilot turn failed:", err);
          await sendReply("Sorry, something went wrong handling that.");
        }
      }
    } catch (err) {
      console.error("[telegram-bot] poll error, retrying in 5s:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main();
