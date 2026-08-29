import type { LeadStage } from "@prisma/client";

export const KANBAN_STAGES: {
  key: LeadStage;
  label: string;
  accent: string;
  dot: string;
}[] = [
  { key: "INTERESTED", label: "Interested", accent: "border-t-sky-500", dot: "bg-sky-500" },
  { key: "RESEARCH", label: "Research", accent: "border-t-amber-500", dot: "bg-amber-500" },
  { key: "READY_TO_CALL", label: "Ready to Call", accent: "border-t-cyan-500", dot: "bg-cyan-500" },
  { key: "CALL_BOOKED", label: "Call Booked", accent: "border-t-indigo-500", dot: "bg-indigo-500" },
  { key: "CALL_TAKEN_PLACE", label: "Call Taken Place", accent: "border-t-violet-500", dot: "bg-violet-500" },
  { key: "DECISION_MAKER", label: "With Decision Maker", accent: "border-t-fuchsia-500", dot: "bg-fuchsia-500" },
  { key: "WON", label: "Won", accent: "border-t-emerald-500", dot: "bg-emerald-500" },
  { key: "LOST", label: "Lost", accent: "border-t-rose-500", dot: "bg-rose-500" },
];
