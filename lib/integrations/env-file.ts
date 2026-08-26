import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env");

// Upserts the given keys into .env in place (preserving comments/order of
// everything else), then mirrors them onto process.env so this running
// server picks them up immediately. A separate process (e.g. the
// telegram:bot script) still needs its own restart to see the change.
export async function updateEnvFile(updates: Record<string, string>): Promise<void> {
  let content = "";
  try {
    content = await readFile(ENV_PATH, "utf-8");
  } catch {
    content = "";
  }

  const lines = content.split("\n");
  const seen = new Set<string>();

  const newLines = lines.map((line) => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (!match) return line;
    const key = match[1];
    if (key in updates) {
      seen.add(key);
      return `${key}="${updates[key]}"`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      newLines.push(`${key}="${value}"`);
    }
  }

  await writeFile(ENV_PATH, newLines.join("\n"));

  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }
}
