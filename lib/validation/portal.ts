import { z } from "zod";

export const addChangeRequestPortalSchema = z.object({
  slug: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export const addCommentPortalSchema = z.object({
  slug: z.string().min(1),
  author: z.string().min(1).max(120),
  content: z.string().min(1).max(5000),
});

export const uploadMediaPortalSchema = z.object({
  slug: z.string().min(1),
  uploadedBy: z.string().min(1).max(120),
});

export const approveDeliverablePortalSchema = z.object({
  slug: z.string().min(1),
  fileId: z.string().min(1),
});
