import { Label } from "@/types/label";
import { cn } from "@/lib/utils";

interface LabelBadgeProps {
  label: Label;
  size?: "sm" | "md";
  className?: string;
}

export function LabelBadge({ label, size = "sm", className }: LabelBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all duration-200",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: label.color ? `${label.color}15` : "#7240fe15",
        color: label.color || "#7240fe",
        border: `1px solid ${label.color ? `${label.color}40` : "#7240fe40"}`,
      }}
    >
      {label.name}
    </span>
  );
}
