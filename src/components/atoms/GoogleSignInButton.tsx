"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  onClick,
  disabled = false,
  className,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-3 w-full px-4 py-3",
        "bg-white border-2 border-gray-300 rounded-xl",
        "text-gray-700 font-medium",
        "hover:bg-gray-50 hover:border-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:ring-offset-2",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label="Sign in with Google"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M19.8055 10.2292C19.8055 9.55155 19.7501 8.86905 19.6318 8.20071H10.2002V12.0488H15.6014C15.3773 13.291 14.6571 14.3896 13.6025 15.0875V17.5863H16.8253C18.7174 15.8449 19.8055 13.2728 19.8055 10.2292Z"
          fill="#4285F4"
        />
        <path
          d="M10.2002 20.0006C12.9518 20.0006 15.2723 19.1151 16.8291 17.5865L13.6063 15.0877C12.7086 15.6979 11.5509 16.0433 10.2041 16.0433C7.5459 16.0433 5.28863 14.2832 4.48818 11.9097H1.16797V14.4866C2.75771 17.6592 6.31945 20.0006 10.2002 20.0006Z"
          fill="#34A853"
        />
        <path
          d="M4.48409 11.9097C4.04545 10.6674 4.04545 9.33393 4.48409 8.09163V5.51465H1.16798C-0.185606 8.21918 -0.185606 11.7818 1.16798 14.4863L4.48409 11.9097Z"
          fill="#FBBC04"
        />
        <path
          d="M10.2002 3.95805C11.6207 3.936 13.0005 4.47247 14.0368 5.45722L16.8902 2.60385C15.1858 0.990847 12.9329 0.0818467 10.2002 0.104597C6.31945 0.104597 2.75771 2.44597 1.16797 5.51472L4.48409 8.0917C5.28045 5.71385 7.5418 3.95805 10.2002 3.95805Z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}
