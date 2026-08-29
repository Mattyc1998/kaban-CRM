import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.extend({
  id: z.string().min(1),
});

export const linkProjectSchema = z.object({
  contactId: z.string().min(1),
  projectId: z.string().min(1),
});

export const unlinkProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const emailDirections = ["SENT", "RECEIVED"] as const;

export const addEmailLogSchema = z.object({
  contactId: z.string().min(1),
  direction: z.enum(emailDirections),
  subject: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  contactedAt: z.coerce.date().optional(),
});

export const deleteEmailLogSchema = z.object({
  id: z.string().min(1),
});
