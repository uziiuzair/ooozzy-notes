"use client";

import { FC, useState } from "react";
import { useLabels } from "@/hooks/useLabels";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";

interface LabelSelectorProps {
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  onCreateNew?: () => void;
}

export const LabelSelector: FC<LabelSelectorProps> = ({
  selectedLabelIds,
  onSelectionChange,
  onCreateNew,
}) => {
  const { labels, loading } = useLabels();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      // Remove label
      onSelectionChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      // Add label
      onSelectionChange([...selectedLabelIds, labelId]);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-400">Loading labels...</div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Typography variant="caption" className="text-gray-500">
          No labels yet. Create your first label!
        </Typography>
        {onCreateNew && (
          <Button onClick={onCreateNew} variant="secondary" size="sm">
            + Create Label
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Typography variant="label" className="text-gray-600 font-medium">
          Labels {selectedLabelIds.length > 0 && `(${selectedLabelIds.length} selected)`}
        </Typography>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-electric-violet hover:text-heliotrope transition-colors"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {labels.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);
            return (
              <button
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${
                    isSelected
                      ? "bg-electric-violet text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
                style={
                  isSelected && label.color
                    ? { backgroundColor: label.color }
                    : undefined
                }
              >
                {label.name}
              </button>
            );
          })}
        </div>
      )}

      {!isExpanded && selectedLabelIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabelIds.slice(0, 3).map((labelId) => {
            const label = labels.find((l) => l.id === labelId);
            if (!label) return null;
            return (
              <span
                key={label.id}
                className="px-2 py-1 rounded-full text-xs font-medium bg-electric-violet text-white"
                style={label.color ? { backgroundColor: label.color } : undefined}
              >
                {label.name}
              </span>
            );
          })}
          {selectedLabelIds.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{selectedLabelIds.length - 3} more
            </span>
          )}
        </div>
      )}

      {onCreateNew && isExpanded && (
        <Button onClick={onCreateNew} variant="secondary" size="sm" className="self-start">
          + Create New Label
        </Button>
      )}
    </div>
  );
};
