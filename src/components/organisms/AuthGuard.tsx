"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard
 *
 * Redirects unauthenticated users to /login
 * Allows access to public routes without authentication
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/terms",
    "/privacy",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // If not authenticated and not on a public route, redirect to login
    if (!user && !isPublicRoute) {
      const loginUrl = pathname === "/"
        ? "/login"
        : `/login?redirect=${encodeURIComponent(pathname)}`;

      router.push(loginUrl);
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-violet"></div>
      </div>
    );
  }

  // If unauthenticated and not on public route, show nothing (redirect will happen)
  if (!user && !isPublicRoute) {
    return null;
  }

  // Render children
  return <>{children}</>;
}
