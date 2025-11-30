"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "@/components/atoms/GoogleSignInButton";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from "@/lib/firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthFormProps {
  mode: "signin" | "signup";
  onSuccess?: () => void;
  className?: string;
}

export function AuthForm({ mode, onSuccess, className }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  // Get redirect path from URL params
  const getRedirectPath = () => {
    const redirect = searchParams.get("redirect");
    return redirect || "/";
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(getRedirectPath());
      }
    } catch (err) {
      setError((err as Error).message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithGoogle();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(getRedirectPath());
      }
    } catch (err) {
      setError((err as Error).message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Google Sign-In */}
      <GoogleSignInButton onClick={handleGoogleAuth} disabled={loading} />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required={isSignUp}
              disabled={loading}
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:border-electric-violet",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:border-electric-violet",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={6}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:border-electric-violet",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-electric-violet text-white font-medium",
            "hover:bg-heliotrope",
            "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:ring-offset-2",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading
            ? "Loading..."
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </button>
      </form>
    </div>
  );
}
