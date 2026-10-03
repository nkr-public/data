"use client";

import * as React from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
}

export interface ShowToastDetail {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

const TOAST_EVENT = "app:toast";
const DEFAULT_DURATION_MS = 5000;

/**
 * Déclenche l'affichage d'une notification interne à l'application
 * (in-app), sans dépendre des notifications natives du système
 * d'exploitation (ex. notifications Windows 11).
 */
export function showToast(detail: ShowToastDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ShowToastDetail>(TOAST_EVENT, { detail }));
}

const variantStyles: Record<ToastVariant, string> = {
  info: "bg-surface border-border text-foreground",
  success: "bg-success/10 border-success/30 text-success",
  warning: "bg-warning/10 border-warning/30 text-warning",
  error: "bg-danger/10 border-danger/30 text-danger",
};

export function ToastProvider() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ShowToastDetail>).detail;
      if (!detail?.message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: ToastMessage = {
        id,
        title: detail.title,
        message: detail.message,
        variant: detail.variant ?? "info",
      };
      setToasts((prev) => [...prev, toast]);
      const duration = detail.durationMs ?? DEFAULT_DURATION_MS;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto rounded-xl border shadow-md px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 ${variantStyles[toast.variant]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {toast.title && <p className="font-semibold mb-0.5">{toast.title}</p>}
              <p className="text-xs opacity-90 break-words">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-xs opacity-80 hover:opacity-100 shrink-0"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
