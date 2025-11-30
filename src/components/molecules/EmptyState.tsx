import { FC } from "react";
import { Typography } from "@/components/atoms/Typography";
import { Button } from "@/components/atoms/Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title = "No notes yet",
  description = "Create your first note to get started",
  actionLabel = "Create Note",
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon || (
        <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}

      <Typography variant="h3" className="text-center mb-2">
        {title}
      </Typography>

      <Typography
        variant="body"
        className="text-center text-gray-500 dark:text-gray-400 mb-6 max-w-md"
      >
        {description}
      </Typography>

      {onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
