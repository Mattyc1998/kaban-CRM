import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.extend({
  id: z.string().min(1),
});

export const createContactPersonSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export const updateContactPersonSchema = createContactPersonSchema.extend({
  id: z.string().min(1),
});

export const deleteContactPersonSchema = z.object({
  id: z.string().min(1),
});

export const linkProjectSchema = z.object({
  companyId: z.string().min(1),
  projectId: z.string().min(1),
});

export const unlinkProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const emailDirections = ["SENT", "RECEIVED"] as const;

export const addEmailLogSchema = z.object({
  companyId: z.string().min(1),
  direction: z.enum(emailDirections),
  subject: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  contactedAt: z.coerce.date().optional(),
});

export const deleteEmailLogSchema = z.object({
  id: z.string().min(1),
});
