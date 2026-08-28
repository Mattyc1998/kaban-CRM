const XAI_BASE_URL = "https://api.x.ai/v1";
const XAI_MODEL = "grok-4.5";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export class XaiNotConfiguredError extends Error {
  constructor() {
    super("XAI_API_KEY is not set — the ClearFlow Copilot isn't configured yet.");
    this.name = "XaiNotConfiguredError";
  }
}

// Thin wrapper around xAI's OpenAI-compatible chat completions endpoint.
export async function callGrok(
  messages: ChatMessage[],
  tools: ToolSchema[]
): Promise<ChatMessage> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new XaiNotConfiguredError();

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`xAI request failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0]?.message;
  if (!choice) throw new Error("xAI returned no message");

  return {
    role: "assistant",
    content: choice.content ?? "",
    tool_calls: choice.tool_calls,
  };
}
