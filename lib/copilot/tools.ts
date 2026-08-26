import { prisma } from "@/lib/prisma";
import type { ToolSchema } from "@/lib/integrations/xai";
import { leadStages } from "@/lib/validation/lead";
import { projectStages, taskPriorities } from "@/lib/validation/project";

type ToolDef = {
  schema: ToolSchema;
  run: (args: Record<string, unknown>) => Promise<unknown>;
};

// Resolves a fuzzy name/email/company query to exactly one Lead. Returns an
// ambiguity payload instead of guessing when there's more than one match —
// the copilot is expected to relay that back to the user rather than act.
async function resolveLead(query: string) {
  const matches = await prisma.lead.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 6,
  });

  if (matches.length === 0) return { error: `No lead matches "${query}".` };
  if (matches.length > 1) {
    return {
      error: "Multiple leads match — ask the user to be more specific.",
      matches: matches.map((m) => ({ id: m.id, name: m.name, company: m.company })),
    };
  }
  return { lead: matches[0] };
}

async function resolveProject(query: string) {
  const matches = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { clientName: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 6,
  });

  if (matches.length === 0) return { error: `No project matches "${query}".` };
  if (matches.length > 1) {
    return {
      error: "Multiple projects match — ask the user to be more specific.",
      matches: matches.map((m) => ({ id: m.id, name: m.name, clientName: m.clientName })),
    };
  }
  return { project: matches[0] };
}

const tools: ToolDef[] = [
  {
    schema: {
      type: "function",
      function: {
        name: "get_dashboard_stats",
        description:
          "Get the same aggregate numbers shown on the Executive Dashboard: lead counts by stage, lead counts by source, total pipeline value, project counts by stage, and overdue task count.",
        parameters: { type: "object", properties: {} },
      },
    },
    run: async () => {
      const [stageCounts, sourceCounts, pipelineValue, projectStageCounts, overdue] =
        await Promise.all([
          prisma.lead.groupBy({ by: ["stage"], _count: true }),
          prisma.lead.groupBy({ by: ["source"], _count: true }),
          prisma.lead.aggregate({ _sum: { dealValue: true }, where: { stage: { not: "LOST" } } }),
          prisma.project.groupBy({ by: ["stage"], _count: true }),
          prisma.projectTask.count({ where: { done: false, dueAt: { lt: new Date() } } }),
        ]);
      return {
        leadsByStage: stageCounts.map((s) => ({ stage: s.stage, count: s._count })),
        leadsBySource: sourceCounts.map((s) => ({ source: s.source, count: s._count })),
        pipelineValue: pipelineValue._sum.dealValue ?? 0,
        projectsByStage: projectStageCounts.map((p) => ({ stage: p.stage, count: p._count })),
        overdueTasks: overdue,
      };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "list_leads",
        description: "List leads, optionally filtered by pipeline stage.",
        parameters: {
          type: "object",
          properties: {
            stage: { type: "string", enum: leadStages, description: "Optional stage filter" },
          },
        },
      },
    },
    run: async (args) => {
      const stage = args.stage as (typeof leadStages)[number] | undefined;
      const leads = await prisma.lead.findMany({
        where: stage ? { stage } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        stage: l.stage,
        source: l.source,
        dealValue: l.dealValue,
      }));
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "get_lead",
        description: "Look up one lead by name, company, or email, including recent activity.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveLead(args.query as string);
      if ("error" in result) return result;
      const activities = await prisma.leadActivity.findMany({
        where: { leadId: result.lead.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      return { ...result.lead, activities };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "list_projects",
        description: "List projects, optionally filtered by stage.",
        parameters: {
          type: "object",
          properties: {
            stage: { type: "string", enum: projectStages },
          },
        },
      },
    },
    run: async (args) => {
      const stage = args.stage as (typeof projectStages)[number] | undefined;
      const projects = await prisma.project.findMany({
        where: stage ? { stage } : undefined,
        include: { tasks: { select: { done: true } }, changeRequests: { where: { status: "PENDING" } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return projects.map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        stage: p.stage,
        progress: p.progress,
        budget: p.budget,
        tasksDone: p.tasks.filter((t) => t.done).length,
        tasksTotal: p.tasks.length,
        pendingChangeRequests: p.changeRequests.length,
      }));
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "get_project",
        description: "Look up one project by name or client name, including tasks, change requests, and comments.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveProject(args.query as string);
      if ("error" in result) return result;
      const full = await prisma.project.findUniqueOrThrow({
        where: { id: result.project.id },
        include: { tasks: true, changeRequests: true, comments: { take: 10, orderBy: { createdAt: "desc" } } },
      });
      return full;
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "move_lead_stage",
        description: "Move a specific, named lead to a new pipeline stage.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Lead name, company, or email" },
            stage: { type: "string", enum: leadStages },
          },
          required: ["query", "stage"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveLead(args.query as string);
      if ("error" in result) return result;
      const stage = args.stage as (typeof leadStages)[number];
      const last = await prisma.lead.findFirst({ where: { stage }, orderBy: { position: "desc" } });
      await prisma.lead.update({
        where: { id: result.lead.id },
        data: { stage, position: (last?.position ?? -1) + 1 },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: result.lead.id,
          type: "STAGE_CHANGE",
          content: `Moved from ${result.lead.stage} to ${stage} by Kaban Copilot`,
        },
      });
      return { ok: true, leadId: result.lead.id, newStage: stage };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "add_lead_note",
        description: "Add a note to a specific, named lead's activity timeline.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Lead name, company, or email" },
            content: { type: "string" },
          },
          required: ["query", "content"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveLead(args.query as string);
      if ("error" in result) return result;
      await prisma.leadActivity.create({
        data: { leadId: result.lead.id, type: "NOTE", content: args.content as string },
      });
      return { ok: true, leadId: result.lead.id };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "update_project_stage",
        description: "Move a specific, named project to a new stage.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Project name or client name" },
            stage: { type: "string", enum: projectStages },
          },
          required: ["query", "stage"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveProject(args.query as string);
      if ("error" in result) return result;
      const stage = args.stage as (typeof projectStages)[number];
      const last = await prisma.project.findFirst({ where: { stage }, orderBy: { position: "desc" } });
      await prisma.project.update({
        where: { id: result.project.id },
        data: { stage, position: (last?.position ?? -1) + 1 },
      });
      return { ok: true, projectId: result.project.id, newStage: stage };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "add_project_task",
        description: "Add a task to a specific, named project.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Project name or client name" },
            title: { type: "string" },
            priority: { type: "string", enum: taskPriorities },
          },
          required: ["query", "title"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveProject(args.query as string);
      if ("error" in result) return result;
      const task = await prisma.projectTask.create({
        data: {
          projectId: result.project.id,
          title: args.title as string,
          priority: (args.priority as (typeof taskPriorities)[number]) ?? "MEDIUM",
        },
      });
      return { ok: true, taskId: task.id };
    },
  },
  {
    schema: {
      type: "function",
      function: {
        name: "add_project_comment",
        description: "Log a comment on a specific, named project (posted as 'Kaban Copilot').",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Project name or client name" },
            content: { type: "string" },
          },
          required: ["query", "content"],
        },
      },
    },
    run: async (args) => {
      const result = await resolveProject(args.query as string);
      if ("error" in result) return result;
      await prisma.projectComment.create({
        data: { projectId: result.project.id, author: "Kaban Copilot", content: args.content as string },
      });
      return { ok: true, projectId: result.project.id };
    },
  },
];

export function getToolSchemas(): ToolSchema[] {
  return tools.map((t) => t.schema);
}

export async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const tool = tools.find((t) => t.schema.function.name === name);
  if (!tool) return { error: `Unknown tool "${name}"` };
  try {
    return await tool.run(args);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool execution failed" };
  }
}
