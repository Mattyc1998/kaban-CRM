import { prisma } from "@/lib/prisma";

// Runs AI research on a lead. Until AI_RESEARCH_API_KEY is configured this
// is stubbed: it marks the lead RUNNING then DONE with placeholder fields,
// so the Kanban UI and webhook flows can be built/tested end-to-end now.
export async function runLeadResearch(leadId: string): Promise<void> {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { aiResearchStatus: "RUNNING" },
  });

  const apiKey = process.env.AI_RESEARCH_API_KEY;

  if (!apiKey) {
    console.log(`[ai-research:stub] would research lead ${leadId} (${lead.name})`);
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiResearchStatus: "DONE",
        aiSummary: `Placeholder summary for ${lead.company || lead.name}. Configure AI_RESEARCH_API_KEY to run real research.`,
        aiPainPoints: "Not yet researched.",
        aiCallAngle: "Not yet researched.",
      },
    });
    return;
  }

  // TODO: call the real AI research provider once AI_RESEARCH_API_KEY is set.
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiResearchStatus: "DONE",
        aiSummary: "Research not yet implemented.",
      },
    });
  } catch (err) {
    console.error(`[ai-research] failed for lead ${leadId}`, err);
    await prisma.lead.update({
      where: { id: leadId },
      data: { aiResearchStatus: "FAILED" },
    });
  }
}
