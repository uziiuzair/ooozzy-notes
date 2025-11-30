"use client";

import { FC } from "react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} handleClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary">
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={variant === "danger" ? "primary" : "primary"}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
