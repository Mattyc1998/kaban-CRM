import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  contactId: z.string().optional(),
  clientName: z.string().max(200).optional().or(z.literal("")),
  clientCompany: z.string().max(200).optional().or(z.literal("")),
  clientEmail: z.string().email().optional().or(z.literal("")),
  scope: z.string().min(1, "Scope of work is required").max(10000),
  price: z.coerce.number().int().min(0).optional(),
});

export const updateProposalSchema = createProposalSchema.extend({
  id: z.string().min(1),
});

export const markProposalSentSchema = z.object({
  id: z.string().min(1),
});

export const convertProposalSchema = z.object({
  proposalId: z.string().min(1),
  templateKey: z.string().optional(),
});

export const signProposalSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "Enter your full name").max(200),
});

export const declineProposalSchema = z.object({
  slug: z.string().min(1),
});
