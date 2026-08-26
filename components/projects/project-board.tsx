"use client";

import { useMemo, useState } from "react";
import type { ProjectStage } from "@prisma/client";
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
import { PROJECT_STAGES } from "@/lib/project-stages";
import { moveProject } from "@/lib/actions/projects";
import { ProjectColumn } from "@/components/projects/project-column";
import { ProjectCard, type ProjectCardData } from "@/components/projects/project-card";
import { ProjectDetailDialog } from "@/components/projects/project-detail-dialog";

type BoardState = Record<ProjectStage, ProjectCardData[]>;

function groupByStage(projects: ProjectCardData[]): BoardState {
  const board = Object.fromEntries(
    PROJECT_STAGES.map((s) => [s.key, [] as ProjectCardData[]])
  ) as BoardState;

  for (const project of projects) {
    board[project.stage].push(project);
  }
  for (const stage of Object.keys(board) as ProjectStage[]) {
    board[stage].sort((a, b) => a.position - b.position);
  }
  return board;
}

function findStageOf(board: BoardState, projectId: string): ProjectStage | null {
  for (const stage of Object.keys(board) as ProjectStage[]) {
    if (board[stage].some((p) => p.id === projectId)) return stage;
  }
  return null;
}

export function ProjectBoard({
  initialProjects,
  searchQuery,
}: {
  initialProjects: ProjectCardData[];
  searchQuery: string;
}) {
  const [board, setBoard] = useState<BoardState>(() => groupByStage(initialProjects));
  const [activeProject, setActiveProject] = useState<ProjectCardData | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectCardData | null>(null);

  const [prevInitialProjects, setPrevInitialProjects] = useState(initialProjects);
  if (initialProjects !== prevInitialProjects) {
    setPrevInitialProjects(initialProjects);
    setBoard(groupByStage(initialProjects));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const allProjects = useMemo(() => Object.values(board).flat(), [board]);

  const query = searchQuery.trim().toLowerCase();
  const filteredBoard = useMemo(() => {
    if (!query) return board;
    const filtered = {} as BoardState;
    for (const stage of Object.keys(board) as ProjectStage[]) {
      filtered[stage] = board[stage].filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.clientName?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [board, query]);

  function handleDragStart(event: DragStartEvent) {
    const project = allProjects.find((p) => p.id === event.active.id);
    setActiveProject(project ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeStage = findStageOf(board, active.id as string);
    const overStage =
      (over.data.current?.stage as ProjectStage | undefined) ??
      findStageOf(board, over.id as string);

    if (!activeStage || !overStage || activeStage === overStage) return;

    setBoard((prev) => {
      const activeItems = prev[activeStage];
      const overItems = prev[overStage];
      const activeIndex = activeItems.findIndex((p) => p.id === active.id);
      if (activeIndex === -1) return prev;

      const [moved] = activeItems.slice(activeIndex, activeIndex + 1);
      const overIndex = overItems.findIndex((p) => p.id === over.id);

      return {
        ...prev,
        [activeStage]: activeItems.filter((p) => p.id !== active.id),
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
    setActiveProject(null);
    if (!over) return;

    const stage = findStageOf(board, active.id as string);
    if (!stage) return;

    const items = board[stage];
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);

    let finalItems = items;
    if (newIndex !== -1 && oldIndex !== newIndex) {
      finalItems = arrayMove(items, oldIndex, newIndex);
      setBoard((prev) => ({ ...prev, [stage]: finalItems }));
    }

    const index = finalItems.findIndex((p) => p.id === active.id);
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
      await moveProject({ id: active.id as string, stage, position: newPosition });
    } catch {
      toast.error("Failed to move project. Refresh and try again.");
    }
  }

  return (
    <div>
      <DndContext
        id="project-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 pb-4">
          {PROJECT_STAGES.map((stage) => (
            <ProjectColumn
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              accent={stage.accent}
              dot={stage.dot}
              projects={filteredBoard[stage.key]}
              onSelectProject={setSelectedProject}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject ? <ProjectCard project={activeProject} /> : null}
        </DragOverlay>
      </DndContext>

      <ProjectDetailDialog
        project={selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
    </div>
  );
}
