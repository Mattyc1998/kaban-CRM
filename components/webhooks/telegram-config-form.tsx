"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveTelegramConfig } from "@/lib/actions/settings";

function mask(value: string) {
  if (!value) return "";
  if (value.length <= 6) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(6)}${value.slice(-2)}`;
}

export function TelegramConfigForm({
  configured,
  currentBotToken,
  currentChatId,
}: {
  configured: boolean;
  currentBotToken: string;
  currentChatId: string;
}) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Enter both the bot token and chat ID");
      return;
    }
    startTransition(async () => {
      try {
        await saveTelegramConfig({ botToken, chatId });
        toast.success("Telegram connected");
        setBotToken("");
        setChatId("");
        router.refresh();
      } catch {
        toast.error("Failed to save Telegram config");
      }
    });
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Send className="size-4 text-primary" />
            Connect Telegram
          </CardTitle>
          {configured ? (
            <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/25 bg-amber-500/10 text-amber-400">
              Not connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="text-xs text-muted-foreground">
          Message{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            @BotFather
          </a>{" "}
          on Telegram to create a bot and get a token, then message your new bot once and check{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            https://api.telegram.org/bot&lt;token&gt;/getUpdates
          </code>{" "}
          for your chat ID.
        </p>

        {configured && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
            Bot token: {mask(currentBotToken)}
            <br />
            Chat ID: {currentChatId}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="tg-token">Bot token</Label>
          <Input
            id="tg-token"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={configured ? "Enter a new token to replace it" : "123456:ABC-DEF..."}
            type="password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tg-chat">Chat ID</Label>
          <Input
            id="tg-chat"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder={configured ? "Enter a new chat ID to replace it" : "123456789"}
          />
        </div>
        <Button size="sm" disabled={pending} onClick={handleSave}>
          {pending ? "Saving..." : "Save & connect"}
        </Button>

        <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <Terminal className="size-3" />
          Run <code className="rounded bg-muted px-1 py-0.5">npm run telegram:bot</code> in a
          separate terminal to start chatting with the Copilot on Telegram.
        </p>
      </CardContent>
    </Card>
  );
}
