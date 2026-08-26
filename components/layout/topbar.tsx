import { Webhook } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="uppercase">Pipeline Ingestion Engine:</span>
        <span className="font-semibold text-emerald-400">Listening</span>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
        <Webhook className="size-3.5 text-primary" />
        Webhooks: n8n &amp; Instantly
      </div>
    </div>
  );
}
