import * as React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
