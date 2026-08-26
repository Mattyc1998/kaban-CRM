import { z } from "zod";

export const leadStages = [
  "COLD_LEAD",
  "CONTACTED",
  "REPLIED",
  "RESEARCH",
  "READY_TO_CALL",
  "CALL_BOOKED",
  "WON",
  "LOST",
] as const;

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  dealValue: z.coerce.number().int().min(0).optional(),
});

export const updateLeadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  company: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

export const moveLeadSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(leadStages),
  position: z.number(),
});

export const addNoteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

// Payload shape accepted from the n8n webhook.
export const n8nLeadPayloadSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  stage: z.enum(leadStages).optional(),
  note: z.string().optional(),
  dealValue: z.coerce.number().int().min(0).optional(),
});

// Payload shape accepted from the Instantly.ai reply webhook.
export const instantlyReplyPayloadSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email(),
  replyBody: z.string().min(1),
});
