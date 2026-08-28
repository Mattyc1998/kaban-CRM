import { prisma } from "@/lib/prisma";
import { callGrok, type ChatMessage } from "@/lib/integrations/xai";
import { getToolSchemas, runTool } from "@/lib/copilot/tools";

const SYSTEM_PROMPT = `You are ClearFlow Copilot, an assistant embedded in the CRM for ClearFlow AI — a lead pipeline and project tracking tool used by Matthew, ClearFlow AI's owner.
Address Matthew directly and by name when it feels natural (e.g. a greeting), but don't force it into every reply.
You have tools to read leads, projects, and dashboard stats, and to make small, explicit changes when asked
(move a named lead or project to a new stage, add a task, log a note or comment).
Rules:
- Only act on a specific, named lead or project. If a tool reports multiple/no matches, ask the user to clarify instead of guessing.
- Never invent data — if a tool call fails or returns nothing, say so.
- Keep answers short and concrete; use numbers from tool results, not estimates.
- You cannot delete anything — there is no delete tool.`;

const HISTORY_LIMIT = 20;
const MAX_TOOL_ROUNDS = 5;

export async function runCopilotTurn(
  channel: "WEB" | "TELEGRAM",
  userText: string
): Promise<string> {
  const history = await prisma.copilotMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  history.reverse();

  await prisma.copilotMessage.create({
    data: { channel, role: "USER", content: userText },
  });

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): ChatMessage => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    })),
    { role: "user", content: userText },
  ];

  const tools = getToolSchemas();
  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const assistantMessage = await callGrok(messages, tools);
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalText = assistantMessage.content;
      break;
    }

    for (const call of assistantMessage.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // malformed args from the model — let the tool see an empty object
      }
      const result = await runTool(call.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    if (round === MAX_TOOL_ROUNDS - 1) {
      finalText = "I made a few tool calls but couldn't finish — try rephrasing or asking a narrower question.";
    }
  }

  await prisma.copilotMessage.create({
    data: { channel, role: "ASSISTANT", content: finalText },
  });

  return finalText;
}
