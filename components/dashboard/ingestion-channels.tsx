import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHANNELS: {
  source: "INSTANTLY" | "N8N" | "MANUAL";
  label: string;
  description: string;
  badgeClassName: string;
}[] = [
  {
    source: "INSTANTLY",
    label: "Instantly.ai",
    description: "Outbound email sequences",
    badgeClassName: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  },
  {
    source: "N8N",
    label: "n8n HTTP",
    description: "Automated scraping & workflows",
    badgeClassName: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  {
    source: "MANUAL",
    label: "Manual entry",
    description: "Direct ingestion & referrals",
    badgeClassName: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
];

export function IngestionChannels({
  counts,
}: {
  counts: Record<"INSTANTLY" | "N8N" | "MANUAL", number>;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Radio className="size-4 text-primary" />
          Lead Ingestion Channels
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4">
        {CHANNELS.map((channel) => (
          <div
            key={channel.source}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={channel.badgeClassName}>
                {channel.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{channel.description}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {counts[channel.source]} Lead{counts[channel.source] === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
