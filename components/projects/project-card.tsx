"use client";

import type { Project } from "@prisma/client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export type ProjectCardData = Project & {
  tasks: { id: string; done: boolean }[];
  files: { id: string }[];
  changeRequests: { id: string }[];
};

function portalUrl(slug: string) {
  if (typeof window === "undefined") return `/portal/${slug}`;
  return `${window.location.origin}/portal/${slug}`;
}

export function ProjectCard({
  project,
  onClick,
  dragHandleProps,
}: {
  project: ProjectCardData;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const stageMeta = PROJECT_STAGES.find((s) => s.key === project.stage)!;
  const doneTasks = project.tasks.filter((t) => t.done).length;
  const pendingChangeRequests = project.changeRequests.length;

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(portalUrl(project.portalSlug));
    toast.success("Portal link copied");
  }

  function viewPortal(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(`/portal/${project.portalSlug}`, "_blank");
  }

  return (
    <Card
      className="cursor-pointer gap-2 border-border/60 py-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
      {...dragHandleProps}
    >
      <CardContent className="px-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-[10px]", stageMeta.badgeClassName)}>
            {stageMeta.label}
          </Badge>
          {project.budget != null && (
            <span className="text-xs font-semibold text-foreground/80">
              ${project.budget.toLocaleString()}
            </span>
          )}
        </div>

        <p className="mt-2 truncate text-sm font-medium leading-tight">{project.name}</p>
        {project.clientName && (
          <p className="truncate text-xs text-muted-foreground">Client: {project.clientName}</p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          <Progress value={project.progress} className="h-1 flex-1" />
          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
            {project.progress}%
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            {doneTasks}/{project.tasks.length} Tasks
          </span>
          <span>
            {project.files.length} Deliverable{project.files.length === 1 ? "" : "s"}
          </span>
        </div>

        {pendingChangeRequests > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-400">
            <AlertCircle className="size-3" />
            {pendingChangeRequests} Client Change Request{pendingChangeRequests === 1 ? "" : "s"} Pending
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2">
          <Button
            variant="ghost"
            size="xs"
            className="h-6 flex-1 text-[11px] text-muted-foreground"
            onClick={copyLink}
          >
            <Copy className="size-3" />
            Copy Portal Link
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="h-6 flex-1 text-[11px] text-primary"
            onClick={viewPortal}
          >
            View Portal
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SortableProjectCard({
  project,
  onClick,
}: {
  project: ProjectCardData;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProjectCard
        project={project}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
