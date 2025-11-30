import { FC, ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export const ContextMenu: FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 max-w-[200px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  );
};

interface ContextMenuItemProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({
  onClick,
  children,
  className,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};

interface ContextMenuSeparatorProps {
  className?: string;
}

export const ContextMenuSeparator: FC<ContextMenuSeparatorProps> = ({
  className,
}) => {
  return <div className={cn("my-1 border-t border-gray-200", className)} />;
};

interface ContextMenuSubmenuProps {
  label: string;
  children: ReactNode;
}

export const ContextMenuSubmenu: FC<ContextMenuSubmenuProps> = ({
  label,
  children,
}) => {
  return (
    <div className="relative group">
      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 flex items-center justify-between">
        {label}
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
      <div className="absolute left-full top-0 ml-1 hidden group-hover:block">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 py-2 min-w-[150px]">
          {children}
        </div>
      </div>
    </div>
  );
};
