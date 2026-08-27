import { z } from "zod";

export const projectStages = [
  "ONBOARDING",
  "PLANNING",
  "BUILDING",
  "REVIEW",
  "CHANGES",
  "COMPLETED",
] as const;

export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  clientName: z.string().max(200).optional().or(z.literal("")),
  clientCompany: z.string().max(200).optional().or(z.literal("")),
  clientEmail: z.string().email().optional().or(z.literal("")),
  budget: z.coerce.number().int().min(0).optional(),
  leadId: z.string().optional(),
});

export const moveProjectSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(projectStages),
  position: z.number(),
});

export const updateProgressSchema = z.object({
  id: z.string().min(1),
  progress: z.coerce.number().int().min(0).max(100),
});

export const addTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(300),
  priority: z.enum(taskPriorities).default("MEDIUM"),
});

export const toggleTaskSchema = z.object({
  taskId: z.string().min(1),
  done: z.boolean(),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().min(1),
});

export const addCommentSchema = z.object({
  projectId: z.string().min(1),
  author: z.string().min(1).max(120),
  content: z.string().min(1).max(5000),
});

export const addChangeRequestSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export const resolveChangeRequestSchema = z.object({
  changeRequestId: z.string().min(1),
});

export const addDeliverableSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  url: z.string().url(),
});

export const approveDeliverableSchema = z.object({
  fileId: z.string().min(1),
});

export const addMilestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  dueAt: z.coerce.date().optional(),
});

export const toggleMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  completed: z.boolean(),
});

export const deleteMilestoneSchema = z.object({
  milestoneId: z.string().min(1),
});
