import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "1. Inbound Ingest",
    title: "n8n / Instantly / Reply",
    detail: "Telegram notification",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  },
  {
    step: "2. AI Synthesis",
    title: "Dossier & Call Angle",
    detail: "Moves to Ready to Call",
    className: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  },
  {
    step: "3. Call & Close",
    title: "Call Booked → Won",
    detail: "1-click convert to project",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  {
    step: "4. Client Portal",
    title: "Sign-Off & Delivery",
    detail: "Milestone completion",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
];

export function WorkflowArchitecture() {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="size-4 text-primary" />
          Automated End-to-End Workflow Architecture
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 px-4 sm:grid-cols-4">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className={cn("rounded-lg border px-3 py-2.5", s.className)}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {s.step}
            </p>
            <p className="mt-1 text-xs font-semibold text-foreground">{s.title}</p>
            <p className="mt-0.5 text-[11px] opacity-80">{s.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
