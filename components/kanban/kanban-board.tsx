"use client";

import { useMemo, useState } from "react";
import type { Lead, LeadStage } from "@prisma/client";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KANBAN_STAGES } from "@/lib/kanban-stages";
import { moveLead } from "@/lib/actions/leads";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { LeadCard } from "@/components/kanban/lead-card";
import { NewLeadDialog } from "@/components/kanban/new-lead-dialog";
import { LeadDetailSheet } from "@/components/kanban/lead-detail-sheet";

type BoardState = Record<LeadStage, Lead[]>;

function groupByStage(leads: Lead[]): BoardState {
  const board = Object.fromEntries(
    KANBAN_STAGES.map((s) => [s.key, [] as Lead[]])
  ) as BoardState;

  for (const lead of leads) {
    board[lead.stage].push(lead);
  }
  for (const stage of Object.keys(board) as LeadStage[]) {
    board[stage].sort((a, b) => a.position - b.position);
  }
  return board;
}

function findStageOf(board: BoardState, leadId: string): LeadStage | null {
  for (const stage of Object.keys(board) as LeadStage[]) {
    if (board[stage].some((l) => l.id === leadId)) return stage;
  }
  return null;
}

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [board, setBoard] = useState<BoardState>(() => groupByStage(initialLeads));
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // initialLeads is a fresh array on every server refetch (router.refresh()
  // after create/move/note/research actions). Resync local board state from
  // it during render (React's recommended pattern) so fields that change
  // server-side (e.g. AI research status) don't go stale.
  const [prevInitialLeads, setPrevInitialLeads] = useState(initialLeads);
  if (initialLeads !== prevInitialLeads) {
    setPrevInitialLeads(initialLeads);
    setBoard(groupByStage(initialLeads));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const allLeads = useMemo(() => Object.values(board).flat(), [board]);

  function handleDragStart(event: DragStartEvent) {
    const lead = allLeads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeStage = findStageOf(board, active.id as string);
    const overStage =
      (over.data.current?.stage as LeadStage | undefined) ??
      findStageOf(board, over.id as string);

    if (!activeStage || !overStage || activeStage === overStage) return;

    setBoard((prev) => {
      const activeItems = prev[activeStage];
      const overItems = prev[overStage];
      const activeIndex = activeItems.findIndex((l) => l.id === active.id);
      if (activeIndex === -1) return prev;

      const [moved] = activeItems.slice(activeIndex, activeIndex + 1);
      const overIndex = overItems.findIndex((l) => l.id === over.id);

      return {
        ...prev,
        [activeStage]: activeItems.filter((l) => l.id !== active.id),
        [overStage]:
          overIndex === -1
            ? [...overItems, { ...moved, stage: overStage }]
            : [
                ...overItems.slice(0, overIndex),
                { ...moved, stage: overStage },
                ...overItems.slice(overIndex),
              ],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const stage = findStageOf(board, active.id as string);
    if (!stage) return;

    const items = board[stage];
    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);

    let finalItems = items;
    if (newIndex !== -1 && oldIndex !== newIndex) {
      finalItems = arrayMove(items, oldIndex, newIndex);
      setBoard((prev) => ({ ...prev, [stage]: finalItems }));
    }

    const index = finalItems.findIndex((l) => l.id === active.id);
    const prevPos = finalItems[index - 1]?.position;
    const nextPos = finalItems[index + 1]?.position;
    const newPosition =
      prevPos !== undefined && nextPos !== undefined
        ? (prevPos + nextPos) / 2
        : prevPos !== undefined
        ? prevPos + 1
        : nextPos !== undefined
        ? nextPos - 1
        : 0;

    try {
      await moveLead({ id: active.id as string, stage, position: newPosition });
    } catch {
      toast.error("Failed to move lead. Refresh and try again.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lead Pipeline</h1>
        <NewLeadDialog />
      </div>

      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 pb-4">
          {KANBAN_STAGES.map((stage) => (
            <KanbanColumn
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              leads={board[stage.key]}
              onSelectLead={setSelectedLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailSheet
        lead={selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
