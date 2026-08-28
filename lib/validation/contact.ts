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
