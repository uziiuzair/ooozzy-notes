import { toast } from "sonner";
import { Label } from "@/types/label";

/**
 * Show interactive label suggestion toast
 * User can accept or dismiss the suggestion
 */
export function showLabelSuggestion(
  type: "note" | "photo" | "link",
  labels: Label[],
  onAccept: () => void | Promise<void>,
  onDismiss?: () => void
) {
  const labelNames = labels.map((l) => l.name).join(", ");
  const typeLabel = type === "note" ? "Note" : type === "photo" ? "Photo" : "Link";

  toast.success(`${typeLabel} created!`, {
    description: `Suggested labels: ${labelNames}`,
    action: {
      label: "Apply",
      onClick: async () => {
        await onAccept();
        toast.success("Labels applied!");
      },
    },
    cancel: {
      label: "Dismiss",
      onClick: () => {
        onDismiss?.();
      },
    },
    duration: 8000, // 8 seconds
  });
}

/**
 * Show folder suggestion toast when card has matching labels
 */
export function showFolderSuggestion(
  folderName: string,
  onMove: () => void | Promise<void>
) {
  toast.info(`Move to "${folderName}" folder?`, {
    description: "This card has matching labels",
    action: {
      label: "Move",
      onClick: async () => {
        await onMove();
        toast.success(`Moved to ${folderName}!`);
      },
    },
    cancel: {
      label: "Keep here",
      onClick: () => {
        // Just dismiss
      },
    },
    duration: 6000, // 6 seconds
  });
}

/**
 * Show inherited label suggestion when card is moved to a folder
 */
export function showInheritedLabelSuggestion(
  folderName: string,
  labels: Label[],
  onAccept: () => void | Promise<void>
) {
  const labelNames = labels.map((l) => l.name).join(", ");

  toast.info(`Inherit labels from "${folderName}"?`, {
    description: `Suggested: ${labelNames}`,
    action: {
      label: "Apply",
      onClick: async () => {
        await onAccept();
        toast.success("Labels inherited!");
      },
    },
    cancel: {
      label: "No thanks",
      onClick: () => {
        // Just dismiss
      },
    },
    duration: 6000,
  });
}

/**
 * Show error toast for label operations
 */
export function showLabelError(message: string) {
  toast.error("Label operation failed", {
    description: message,
    duration: 4000,
  });
}
