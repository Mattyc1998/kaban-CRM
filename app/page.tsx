import Link from "next/link";
import {
  MessageSquare,
  Phone,
  CalendarCheck,
  Trophy,
  PoundSterling,
  FolderOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { monthlyRetainerValue } from "@/lib/company-types";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { IngestionChannels } from "@/components/dashboard/ingestion-channels";
import { WorkflowArchitecture } from "@/components/dashboard/workflow-architecture";
import { WebhookSimulatorDialog } from "@/components/dashboard/webhook-simulator-dialog";
import { NewLeadDialog } from "@/components/kanban/new-lead-dialog";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  const [
    stageCounts,
    sourceCounts,
    pipelineValue,
    projectStageCounts,
    overdueMilestones,
    activeRetainers,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["stage"], _count: true }),
    prisma.lead.groupBy({ by: ["source"], _count: true }),
    prisma.lead.aggregate({
      _sum: { dealValue: true },
      where: { stage: { not: "LOST" } },
    }),
    prisma.project.groupBy({ by: ["stage"], _count: true }),
    prisma.projectTask.count({
      where: { done: false, dueAt: { lt: new Date() } },
    }),
    prisma.project.findMany({
      where: { retainerActive: true },
      select: { retainerAmount: true, retainerActive: true, retainerInterval: true },
    }),
  ]);

  const stage = (key: string) =>
    stageCounts.find((s) => s.stage === key)?._count ?? 0;
  const source = (key: "MANUAL" | "N8N" | "INSTANTLY") =>
    sourceCounts.find((s) => s.source === key)?._count ?? 0;
  const projectStage = (...keys: string[]) =>
    projectStageCounts
      .filter((p) => keys.includes(p.stage))
      .reduce((sum, p) => sum + p._count, 0);

  const value = pipelineValue._sum.dealValue ?? 0;
  // Normalizes any YEARLY retainers to their monthly equivalent so mixed
  // monthly/yearly billing still rolls up into an accurate MRR figure.
  const mrr = activeRetainers.reduce((sum, p) => sum + monthlyRetainerValue(p), 0);

  return (
    <AppShell active="/">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-5">
        <div>
          <Badge variant="outline" className="mb-2 gap-1.5 border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="size-3" />
            ClearFlow AI &middot; Automated CRM &amp; Project Pipeline
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName ? `Welcome back, ${firstName}` : "Executive Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {firstName ? "Executive Dashboard — r" : "R"}eal-time telemetry across multi-source lead ingestion,
            automated AI research, and client delivery for ClearFlow AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WebhookSimulatorDialog />
          <NewLeadDialog />
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <PoundSterling className="size-3.5 text-primary" />
            Sales &amp; Pipeline Metrics
          </h2>
          <Link
            href="/leads"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View Full Lead Kanban <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCard
            icon={MessageSquare}
            iconClassName="bg-amber-500/15 text-amber-400"
            label="Interested"
            value={stage("INTERESTED")}
            sublabel="Newly added leads"
          />
          <StatCard
            icon={Phone}
            iconClassName="bg-cyan-500/15 text-cyan-400"
            label="Ready to Call"
            value={stage("READY_TO_CALL")}
            sublabel="AI research dossier ready"
          />
          <StatCard
            icon={CalendarCheck}
            iconClassName="bg-indigo-500/15 text-indigo-400"
            label="Calls Booked"
            value={stage("CALL_BOOKED")}
            sublabel="Demo scheduled"
          />
          <StatCard
            icon={Trophy}
            iconClassName="bg-emerald-500/15 text-emerald-400"
            label="Won Leads"
            value={stage("WON")}
            sublabel="Converted to active clients"
          />
          <StatCard
            icon={PoundSterling}
            iconClassName="bg-violet-500/15 text-violet-400"
            label="Pipeline Value"
            value={`£${value.toLocaleString()}`}
            sublabel="Total deal value in CRM"
          />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FolderOpen className="size-3.5 text-primary" />
            Project Delivery &amp; Client Tracking
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View Projects Board <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <StatCard
            icon={FolderOpen}
            iconClassName="bg-indigo-500/15 text-indigo-400"
            label="Active Projects"
            value={projectStage("ONBOARDING", "PLANNING", "BUILDING", "REVIEW", "CHANGES")}
            sublabel="Under construction / review"
          />
          <StatCard
            icon={Clock}
            iconClassName="bg-amber-500/15 text-amber-400"
            label="Awaiting Client"
            value={projectStage("REVIEW")}
            sublabel="Deliverables in review"
          />
          <StatCard
            icon={AlertTriangle}
            iconClassName="bg-rose-500/15 text-rose-400"
            label="Overdue Milestones"
            value={overdueMilestones}
            sublabel="Requires engineering attention"
          />
          <StatCard
            icon={CheckCircle2}
            iconClassName="bg-emerald-500/15 text-emerald-400"
            label="Completed Projects"
            value={projectStage("COMPLETED")}
            sublabel="Successfully launched"
          />
          <StatCard
            icon={RefreshCw}
            iconClassName="bg-teal-500/15 text-teal-400"
            label="Monthly Recurring Revenue"
            value={`£${Math.round(mrr).toLocaleString()}`}
            sublabel={`${activeRetainers.length} active retainer${activeRetainers.length === 1 ? "" : "s"} · £${Math.round(mrr * 12).toLocaleString()}/yr equivalent`}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <IngestionChannels
          counts={{
            INSTANTLY: source("INSTANTLY"),
            N8N: source("N8N"),
            MANUAL: source("MANUAL"),
          }}
        />
        <WorkflowArchitecture />
      </section>
    </AppShell>
  );
}
