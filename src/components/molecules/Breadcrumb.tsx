"use client";

import { FC } from "react";

export interface BreadcrumbItem {
  id: string | null; // null for root/home
  label: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string | null) => void;
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.id || "root"} className="flex items-center gap-2">
            {isLast ? (
              // Current folder - not clickable
              <span className="font-semibold text-gray-900">{item.label}</span>
            ) : (
              // Previous folders - clickable
              <>
                <button
                  onClick={() => onNavigate(item.id)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-4 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};
