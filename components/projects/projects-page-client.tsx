"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectBoard } from "@/components/projects/project-board";
import type { ProjectCardData } from "@/components/projects/project-card";

export function ProjectsPageClient({
  initialProjects,
  activeCount,
  activeBudget,
}: {
  initialProjects: ProjectCardData[];
  activeCount: number;
  activeBudget: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Project Tracking Board</h1>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
              {activeCount} Active Project{activeCount === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Flow: Onboarding → Planning → Building → Review → Changes → Completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-8 gap-1.5 border-violet-500/25 bg-violet-500/10 px-3 text-sm text-violet-300"
          >
            Active Budget: £{activeBudget.toLocaleString()}
          </Badge>
          <NewProjectDialog />
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search project title or client..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <ProjectBoard initialProjects={initialProjects} searchQuery={searchQuery} />
    </div>
  );
}
