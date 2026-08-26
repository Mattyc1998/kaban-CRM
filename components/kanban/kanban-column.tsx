"use client";

import type { Lead, LeadStage } from "@prisma/client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SortableLeadCard } from "@/components/kanban/lead-card";

export function KanbanColumn({
  stage,
  label,
  accent,
  dot,
  leads,
  onSelectLead,
}: {
  stage: LeadStage;
  label: string;
  accent: string;
  dot: string;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-t-4 bg-card/60 shadow-sm transition-colors",
        accent,
        isOver && "bg-accent/40 ring-1 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", dot)} />
          <span className="text-sm font-semibold text-foreground/90">{label}</span>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {leads.length}
        </Badge>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 p-2">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
