import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Vérification optimiste (présence du cookie de session uniquement, pas de
// lecture DB ni de vérification de sa validité) : rapide, mais ne fait pas
// autorité. La vérification qui fait autorité reste côté serveur dans
// requireCurrentUser() (voir lib/current-user.ts) — Next.js recommande de ne
// jamais protéger un Server Function via le seul Proxy.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/activities",
    "/activities/:path*",
    "/flights/new",
    "/qualifications",
    "/qualifications/:path*",
    "/equipment",
    "/equipment/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
