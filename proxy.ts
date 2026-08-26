import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Edge runtime: use the lightweight authConfig (no Prisma/bcrypt) here,
// not the full lib/auth.ts config, which pulls in Node-only Credentials logic.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  // Public, gated only by knowing the unguessable portal slug — no Customer
  // login exists yet (later phase).
  const isPortalPage = req.nextUrl.pathname.startsWith("/portal");

  if (!isLoggedIn && !isLoginPage && !isPortalPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
