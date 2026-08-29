import type { Company, Contact, Project, Lead, EmailLog, EmailAttachment } from "@prisma/client";

export type ProjectMoney = Pick<
  Project,
  "id" | "name" | "stage" | "budget" | "portalSlug" | "retainerAmount" | "retainerActive" | "retainerInterval"
>;

// Normalizes a project's retainer to its monthly-equivalent value — a
// YEARLY retainer divides by 12 — so MRR roll-ups stay accurate when
// projects mix monthly and yearly billing instead of just summing raw
// amounts as if everything were monthly.
export function monthlyRetainerValue(project: Pick<ProjectMoney, "retainerActive" | "retainerAmount" | "retainerInterval">) {
  if (!project.retainerActive || project.retainerAmount == null) return 0;
  return project.retainerInterval === "YEARLY" ? project.retainerAmount / 12 : project.retainerAmount;
}

export type EmailLogWithAttachments = EmailLog & { attachments: EmailAttachment[] };

export type CompanyWithRelations = Company & {
  contacts: Contact[];
  projects: ProjectMoney[];
  leads: Pick<Lead, "id" | "name" | "stage">[];
  emailLogs: EmailLogWithAttachments[];
};
