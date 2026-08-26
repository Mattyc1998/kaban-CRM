"use client";

import type { ProjectStage } from "@prisma/client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SortableProjectCard, type ProjectCardData } from "@/components/projects/project-card";

export function ProjectColumn({
  stage,
  label,
  accent,
  dot,
  projects,
  onSelectProject,
}: {
  stage: ProjectStage;
  label: string;
  accent: string;
  dot: string;
  projects: ProjectCardData[];
  onSelectProject: (project: ProjectCardData) => void;
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
          <span className="text-sm font-semibold uppercase tracking-wide text-foreground/90">
            {label}
          </span>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {projects.length}
        </Badge>
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 p-2">
        {projects.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            No projects in this stage
          </p>
        )}
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <SortableProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
