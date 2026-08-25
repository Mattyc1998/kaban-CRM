"use client";

import type { Lead, LeadStage } from "@prisma/client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { SortableLeadCard } from "@/components/kanban/lead-card";

export function KanbanColumn({
  stage,
  label,
  leads,
  onSelectLead,
}: {
  stage: LeadStage;
  label: string;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: stage,
    data: { stage },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary">{leads.length}</Badge>
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
