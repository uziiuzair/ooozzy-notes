"use client";

import { useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";

/**
 * Custom hook to access authentication state
 *
 * @returns {AuthContextType} Authentication state
 *
 * @example
 * const { user, loading, isAuthenticated } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
