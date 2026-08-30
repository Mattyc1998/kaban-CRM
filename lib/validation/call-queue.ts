import { z } from "zod";

export const callQueueStatuses = ["ACTIVE", "COMPLETE"] as const;

export const importCallQueueRowSchema = z.object({
  leadName: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  sequenceDay: z.coerce.number().int(),
  nextCallDate: z.coerce.date(),
  status: z
    .string()
    .transform((s) => s.toUpperCase())
    .pipe(z.enum(callQueueStatuses))
    .default("ACTIVE"),
  source: z.string().optional(),
  placeId: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  rating: z.coerce.number().optional(),
  reviews: z.coerce.number().int().optional(),
});

export const importCallQueueSchema = z.array(importCallQueueRowSchema).min(1);

export const rescheduleCallQueueSchema = z.object({
  id: z.string().min(1),
  nextCallDate: z.coerce.date(),
});

export const callOutcomes = ["NO_ANSWER", "NOT_INTERESTED", "INTERESTED"] as const;

export const markCalledSchema = z.object({
  id: z.string().min(1),
  // NO_ANSWER keeps advancing the 1/3/5/7 cadence (the original default
  // behavior); NOT_INTERESTED marks complete immediately regardless of
  // day. INTERESTED goes through convertCallQueueLeadToLead instead — it
  // needs to create a Lead, not just flip a status.
  outcome: z.enum(callOutcomes).default("NO_ANSWER"),
});

export const deleteCallQueueLeadSchema = z.object({
  id: z.string().min(1),
});

export const convertCallQueueLeadSchema = z.object({
  id: z.string().min(1),
});
