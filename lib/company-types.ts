import type { Company, Contact, Project, Lead, EmailLog, EmailAttachment } from "@prisma/client";

export type ProjectMoney = Pick<
  Project,
  "id" | "name" | "stage" | "budget" | "portalSlug" | "retainerAmount" | "retainerActive"
>;

export type EmailLogWithAttachments = EmailLog & { attachments: EmailAttachment[] };

export type CompanyWithRelations = Company & {
  contacts: Contact[];
  projects: ProjectMoney[];
  leads: Pick<Lead, "id" | "name" | "stage">[];
  emailLogs: EmailLogWithAttachments[];
};
