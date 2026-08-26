import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Prisma/bcrypt) shared by the full Node config
// (lib/auth.ts) and the Edge proxy (proxy.ts), which can't load Node builtins.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  // Vercel sits behind a proxy with no fixed URL known ahead of time —
  // Auth.js needs this to trust the forwarded host instead of rejecting it.
  trustHost: true,
} satisfies NextAuthConfig;
