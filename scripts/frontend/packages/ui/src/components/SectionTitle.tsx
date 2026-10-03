import React from "react";

export interface SectionTitleProps {
  icon?: React.ReactNode;
  title: string;
  className?: string;
}

export function SectionTitle({ icon, title, className = "" }: SectionTitleProps) {
  return (
    <h2 className={`text-lg font-semibold flex items-center gap-2 text-foreground ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{title}</span>
    </h2>
  );
}
