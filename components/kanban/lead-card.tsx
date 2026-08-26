"use client";

import type { Lead } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SOURCE_STYLE: Record<Lead["source"], { label: string; className: string }> = {
  MANUAL: { label: "Manual", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  N8N: { label: "n8n", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  INSTANTLY: { label: "Instantly", className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
};

const RESEARCH_STYLE: Record<Lead["aiResearchStatus"], { label: string; className: string }> = {
  NONE: { label: "", className: "" },
  PENDING: { label: "Research pending", className: "bg-muted text-muted-foreground" },
  RUNNING: { label: "Researching…", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  DONE: { label: "Researched", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  FAILED: { label: "Research failed", className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function LeadCard({
  lead,
  onClick,
  dragHandleProps,
}: {
  lead: Lead;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const source = SOURCE_STYLE[lead.source];
  const research = RESEARCH_STYLE[lead.aiResearchStatus];

  return (
    <Card
      className="cursor-pointer gap-2 border-border/60 py-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
      {...dragHandleProps}
    >
      <CardContent className="flex items-start gap-2.5 px-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {initials(lead.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{lead.name}</p>
          {lead.company && (
            <p className="truncate text-xs text-muted-foreground">{lead.company}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className={cn("border-transparent text-[10px]", source.className)}>
              {source.label}
            </Badge>
            {lead.aiResearchStatus !== "NONE" && (
              <Badge variant="outline" className={cn("border-transparent text-[10px]", research.className)}>
                {research.label}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SortableLeadCard({
  lead,
  onClick,
}: {
  lead: Lead;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard lead={lead} onClick={onClick} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
