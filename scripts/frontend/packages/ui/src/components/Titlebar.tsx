"use client";

import * as React from "react";
import { WindowControls } from "./WindowControls";

export interface TitlebarProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  appName?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  forceShowControls?: boolean;
}

export function Titlebar({
  icon,
  appName,
  badge,
  children,
  actions,
  forceShowControls = false,
  className = "",
  ...props
}: TitlebarProps) {
  const handleDoubleClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).getAttribute("data-tauri-drag-region") === "") {
      try {
        const isTauriEnv =
          typeof window !== "undefined" &&
          Boolean(
            (window as any).isTauri ||
            (window as any).__TAURI_INTERNALS__ ||
            (window as any).__TAURI__
          );
        if (isTauriEnv) {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          await getCurrentWindow().toggleMaximize();
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={handleDoubleClick}
      className={`sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur select-none ${className}`}
      {...props}
    >
      <div
        data-tauri-drag-region
        className="w-full px-3 sm:px-4 lg:px-6 h-12 sm:h-14 flex items-center justify-between gap-4"
      >
        <div data-tauri-drag-region className="flex items-center gap-4 sm:gap-6 min-w-0">
          {(icon || appName) && (
            <div data-tauri-drag-region="false" className="flex items-center gap-2.5 font-black text-lg sm:text-xl text-primary shrink-0">
              {icon}
              {appName && (
                <span className="flex items-center gap-2 truncate">
                  {appName}
                  {badge}
                </span>
              )}
            </div>
          )}
          {children}
        </div>

        <div data-tauri-drag-region="false" className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {actions}
          <WindowControls forceShow={forceShowControls} />
        </div>
      </div>
    </header>
  );
}
