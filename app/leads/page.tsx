import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });

  return (
    <AppShell active="/leads">
      <KanbanBoard initialLeads={leads} />
    </AppShell>
  );
}
