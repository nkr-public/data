"use client";

import * as React from "react";
import { Minus, X } from "lucide-react";

export interface WindowControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  forceShow?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WindowControls({
  className = "",
  forceShow = false,
  size = "md",
  ...props
}: WindowControlsProps) {
  const [isTauri, setIsTauri] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    const isTauriEnv =
      typeof window !== "undefined" &&
      Boolean(
        (window as any).isTauri ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI__
      );

    setIsTauri(isTauriEnv);

    if (!isTauriEnv) return;

    let unlisten: (() => void) | undefined;

    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();
        const max = await appWindow.isMaximized();
        setIsMaximized(max);

        unlisten = await appWindow.onResized(async () => {
          try {
            const currentMax = await appWindow.isMaximized();
            setIsMaximized(currentMax);
          } catch {
            // ignore
          }
        });
      } catch (err) {
        console.warn("Failed to initialize Tauri window controls:", err);
      }
    })();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn("Tauri minimize error:", err);
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch (err) {
      console.warn("Tauri toggleMaximize error:", err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch (err) {
      console.warn("Tauri close error:", err);
    }
  };

  if (!isTauri && !forceShow) {
    return null;
  }

  const btnSizeClasses = {
    sm: "w-8 h-7 rounded-md",
    md: "w-9 sm:w-10 h-8 rounded-md",
    lg: "w-11 h-9 rounded-lg",
  }[size] || "w-9 sm:w-10 h-8 rounded-md";

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size] || "w-3.5 h-3.5";

  return (
    <div
      data-tauri-drag-region="false"
      className={`inline-flex items-center gap-1 pl-2 ml-1 border-l border-border/70 select-none shrink-0 ${className}`}
      {...props}
    >
      <button
        type="button"
        onClick={handleMinimize}
        title="Réduire"
        aria-label="Réduire"
        data-tauri-drag-region="false"
        className={`inline-flex items-center justify-center ${btnSizeClasses} text-foreground-muted hover:text-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer focus:outline-none`}
      >
        <Minus className={iconSizeClasses} />
      </button>

      <button
        type="button"
        onClick={handleToggleMaximize}
        title={isMaximized ? "Restaurer" : "Agrandir"}
        aria-label={isMaximized ? "Restaurer" : "Agrandir"}
        data-tauri-drag-region="false"
        className={`inline-flex items-center justify-center ${btnSizeClasses} text-foreground-muted hover:text-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer focus:outline-none`}
      >
        {isMaximized ? (
          <svg className={iconSizeClasses} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4.5" y="1.5" width="10" height="10" rx="1.5" />
            <path d="M1.5 4.5v7a1.5 1.5 0 0 0 1.5 1.5h7" />
          </svg>
        ) : (
          <svg className={iconSizeClasses} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={handleClose}
        title="Fermer"
        aria-label="Fermer"
        data-tauri-drag-region="false"
        className={`inline-flex items-center justify-center ${btnSizeClasses} text-foreground-muted hover:text-white hover:bg-rose-600 active:bg-rose-700 active:scale-95 transition-all cursor-pointer focus:outline-none`}
      >
        <X className={iconSizeClasses} />
      </button>
    </div>
  );
}
