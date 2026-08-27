import { headers } from "next/headers";
import { Webhook, Send, Sparkles, Copy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/integrations/settings-store";
import { AppShell } from "@/components/layout/app-shell";
import { IngestionChannels } from "@/components/dashboard/ingestion-channels";
import { WebhookSimulatorDialog } from "@/components/dashboard/webhook-simulator-dialog";
import { TelegramConfigForm } from "@/components/webhooks/telegram-config-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
      Configured
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-500/25 bg-amber-500/10 text-amber-400">
      Not configured (stubbed)
    </Badge>
  );
}

export default async function WebhooksPage() {
  const host = (await headers()).get("host");
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = `${proto}://${host}`;

  const sourceCounts = await prisma.lead.groupBy({ by: ["source"], _count: true });
  const source = (key: "MANUAL" | "N8N" | "INSTANTLY") =>
    sourceCounts.find((s) => s.source === key)?._count ?? 0;

  const endpoints = [
    {
      name: "n8n",
      description: "Point an n8n HTTP Request node here to create/update leads.",
      path: "/api/webhooks/n8n",
      secretEnv: "N8N_WEBHOOK_SECRET",
      configured: !!process.env.N8N_WEBHOOK_SECRET,
    },
    {
      name: "Instantly.ai",
      description: "Paste this URL into Instantly's webhook settings for the “reply received” event.",
      path: "/api/webhooks/instantly",
      secretEnv: "INSTANTLY_WEBHOOK_SECRET",
      configured: !!process.env.INSTANTLY_WEBHOOK_SECRET,
    },
  ];

  const integrations = [
    { name: "Kaban Copilot (xAI Grok)", envVar: "XAI_API_KEY", configured: !!process.env.XAI_API_KEY },
    { name: "AI research provider", envVar: "AI_RESEARCH_API_KEY", configured: !!process.env.AI_RESEARCH_API_KEY },
    {
      name: "Media storage (Vercel Blob)",
      envVar: "BLOB_READ_WRITE_TOKEN",
      configured: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
  ];

  const [telegramBotToken, telegramChatId, telegramWebhookEnabled] = await Promise.all([
    getSetting("TELEGRAM_BOT_TOKEN"),
    getSetting("TELEGRAM_CHAT_ID"),
    getSetting("TELEGRAM_WEBHOOK_ENABLED"),
  ]);
  const telegramConfigured = !!telegramBotToken && !!telegramChatId;

  return (
    <AppShell active="/webhooks">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Webhook className="size-5 text-primary" />
            Webhooks &amp; Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inbound integrations that feed the Lead Pipeline automatically.
          </p>
        </div>
        <WebhookSimulatorDialog />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {endpoints.map((ep) => (
          <Card key={ep.name} className="gap-3 py-4">
            <CardHeader className="px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Send className="size-4 text-primary" />
                  {ep.name}
                </CardTitle>
                <StatusBadge configured={ep.configured} />
              </div>
            </CardHeader>
            <CardContent className="px-4">
              <p className="mb-3 text-xs text-muted-foreground">{ep.description}</p>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-xs">
                <span className="truncate text-foreground/80">
                  POST {origin}
                  {ep.path}
                </span>
                <Copy className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Auth header: <code className="rounded bg-muted px-1 py-0.5">x-webhook-secret</code>{" "}
                — set via <code className="rounded bg-muted px-1 py-0.5">{ep.secretEnv}</code> in{" "}
                <code className="rounded bg-muted px-1 py-0.5">.env</code>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <TelegramConfigForm
          configured={telegramConfigured}
          currentBotToken={telegramBotToken ?? ""}
          currentChatId={telegramChatId ?? ""}
          webhookEnabled={telegramWebhookEnabled === "true"}
        />

        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Downstream Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4">
            {integrations.map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
              >
                <span className="text-sm">{i.name}</span>
                <StatusBadge configured={i.configured} />
              </div>
            ))}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Unconfigured AI integrations stub gracefully (log what they&rsquo;d send). Media storage is
              the exception — file uploads need it to actually work, and show a clear error until it&rsquo;s set up.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <IngestionChannels
          counts={{
            INSTANTLY: source("INSTANTLY"),
            N8N: source("N8N"),
            MANUAL: source("MANUAL"),
          }}
        />
      </div>
    </AppShell>
  );
}
