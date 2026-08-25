import type { LeadStage } from "@prisma/client";

export const KANBAN_STAGES: { key: LeadStage; label: string }[] = [
  { key: "COLD_LEAD", label: "Cold Lead" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "REPLIED", label: "Replied" },
  { key: "RESEARCH", label: "Research" },
  { key: "READY_TO_CALL", label: "Ready to Call" },
  { key: "CALL_BOOKED", label: "Call Booked" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];
