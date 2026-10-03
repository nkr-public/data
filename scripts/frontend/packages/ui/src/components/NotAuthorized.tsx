import * as React from "react";
import { ShieldAlert } from "lucide-react";

export interface NotAuthorizedProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function NotAuthorized({
  title = "Accès non autorisé",
  description = "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
  action,
}: NotAuthorizedProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12 text-center space-y-4 shadow-sm">
      <div className="bg-danger/10 text-danger p-4 rounded-2xl">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-black text-foreground">{title}</h2>
        <p className="text-sm text-foreground-muted max-w-md">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
