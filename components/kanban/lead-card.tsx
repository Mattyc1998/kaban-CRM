"use client";

import type { Lead } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SOURCE_LABEL: Record<Lead["source"], string> = {
  MANUAL: "Manual",
  N8N: "n8n",
  INSTANTLY: "Instantly",
};

const RESEARCH_LABEL: Record<Lead["aiResearchStatus"], string> = {
  NONE: "",
  PENDING: "Research pending",
  RUNNING: "Researching…",
  DONE: "Researched",
  FAILED: "Research failed",
};

export function LeadCard({
  lead,
  onClick,
  dragHandleProps,
}: {
  lead: Lead;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <Card
      className="cursor-pointer gap-2 py-3 shadow-sm"
      onClick={onClick}
      {...dragHandleProps}
    >
      <CardContent className="px-3">
        <p className="text-sm font-medium leading-tight">{lead.name}</p>
        {lead.company && (
          <p className="text-xs text-muted-foreground">{lead.company}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">
            {SOURCE_LABEL[lead.source]}
          </Badge>
          {lead.aiResearchStatus !== "NONE" && (
            <Badge variant="outline" className="text-[10px]">
              {RESEARCH_LABEL[lead.aiResearchStatus]}
            </Badge>
          )}
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
