import { randomBytes } from "node:crypto";

// Turns "Vanguard Quantum Corp Implementation" into
// "vanguard-quantum-corp-implementation-a37300df" — unguessable enough to
// act as access control for the public portal page until real Customer
// login exists.
export function generatePortalSlug(projectName: string): string {
  const base = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const suffix = randomBytes(4).toString("hex");
  return `${base || "project"}-${suffix}`;
}
