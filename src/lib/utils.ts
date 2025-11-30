import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function stripHtml(html: string): string {
  // Remove HTML tags and decode HTML entities
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export function stripHtmlForPreview(html: string): string {
  // Create a temporary element to parse HTML
  if (typeof window === "undefined") {
    // Fallback for SSR - simple regex strip
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;

  // Get text content and clean it up
  let text = tmp.textContent || tmp.innerText || " ";

  // Remove extra whitespace and line breaks
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
