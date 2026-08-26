import type { ProjectStage } from "@prisma/client";

export const PROJECT_STAGES: {
  key: ProjectStage;
  label: string;
  accent: string;
  dot: string;
  badgeClassName: string;
}[] = [
  {
    key: "ONBOARDING",
    label: "Onboarding",
    accent: "border-t-slate-400",
    dot: "bg-slate-400",
    badgeClassName: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  },
  {
    key: "PLANNING",
    label: "Planning",
    accent: "border-t-amber-500",
    dot: "bg-amber-500",
    badgeClassName: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  {
    key: "BUILDING",
    label: "Building",
    accent: "border-t-sky-500",
    dot: "bg-sky-500",
    badgeClassName: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  },
  {
    key: "REVIEW",
    label: "Review",
    accent: "border-t-violet-500",
    dot: "bg-violet-500",
    badgeClassName: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  },
  {
    key: "CHANGES",
    label: "Changes",
    accent: "border-t-rose-500",
    dot: "bg-rose-500",
    badgeClassName: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    accent: "border-t-emerald-500",
    dot: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
];
