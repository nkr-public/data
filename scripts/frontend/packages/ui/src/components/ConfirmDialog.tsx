"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${variant === "danger" ? "bg-rose-500/10" : "bg-primary/10"}`}>
              <AlertTriangle className={`w-5 h-5 ${variant === "danger" ? "text-rose-600" : "text-primary"}`} />
            </div>
            <h2 className="text-base font-black text-foreground">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-foreground-muted hover:text-foreground p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && <p className="text-sm text-foreground-muted">{message}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "ghost" : "primary"}
            className={variant === "danger" ? "text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900" : undefined}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Traitement..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
