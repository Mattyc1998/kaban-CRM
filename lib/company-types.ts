import type { Company, Contact, Project, Lead, EmailLog } from "@prisma/client";

export type ProjectMoney = Pick<
  Project,
  "id" | "name" | "stage" | "budget" | "portalSlug" | "retainerAmount" | "retainerActive"
>;

export type CompanyWithRelations = Company & {
  contacts: Contact[];
  projects: ProjectMoney[];
  leads: Pick<Lead, "id" | "name" | "stage">[];
  emailLogs: EmailLog[];
};
