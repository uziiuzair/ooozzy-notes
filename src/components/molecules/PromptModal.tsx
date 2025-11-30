"use client";

import { FC, useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
}

export const PromptModal: FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  submitText = "Submit",
  cancelText = "Cancel",
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} handleClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        )}
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <Button type="button" onClick={onClose} variant="secondary">
            {cancelText}
          </Button>
          <Button type="submit" variant="primary" disabled={!value.trim()}>
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
