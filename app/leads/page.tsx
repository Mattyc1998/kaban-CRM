import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ stage: "asc" }, { position: "asc" }],
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-x-auto p-6">
        <KanbanBoard initialLeads={leads} />
      </main>
    </div>
  );
}
