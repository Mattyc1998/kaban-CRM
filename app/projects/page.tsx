import { FolderKanban } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProjectsPage() {
  return (
    <AppShell active="/projects">
      <ComingSoon
        icon={FolderKanban}
        title="Project Tracking"
        description="Onboarding → Planning → Building → Review → Changes → Completed, with tasks, deadlines, files, and customer requests."
        note="The database schema (Project, ProjectTask, ProjectFile, ProjectComment) already exists — this board is next up after the Lead Kanban."
      />
    </AppShell>
  );
}
