import type { TaskPriority } from "@prisma/client";

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};
