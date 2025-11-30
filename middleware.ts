import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for Authentication
 *
 * NOTE: Firebase Auth uses client-side auth state (IndexedDB/localStorage).
 * For MVP, we're using client-side auth guards instead of middleware.
 * For production, consider implementing Firebase Admin SDK with custom auth cookies.
 *
 * This middleware is currently DISABLED (allows all routes).
 * Auth protection is handled client-side in AuthGuard component.
 */

export async function middleware(request: NextRequest) {
  // Allow all routes for now
  // Auth protection is handled client-side via AuthGuard
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
