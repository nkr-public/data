import * as React from "react";

export type StateKind = "loading" | "error" | "empty" | "offline";

export interface StateMessageProps {
  kind: StateKind;
  message?: string;
  title?: string;
  description?: string;
}

const defaults: Record<StateKind, string> = {
  loading: "Chargement en cours...",
  error: "Une erreur est survenue. Veuillez réessayer.",
  empty: "Aucun résultat à afficher.",
  offline: "Vous êtes hors connexion. Certaines actions sont indisponibles.",
};

export function StateMessage({ kind, message, title, description }: StateMessageProps) {
  if (title || description) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-8 text-center space-y-1">
        {title && <h3 className="font-semibold text-foreground text-sm">{title}</h3>}
        {description && <p className="text-xs text-foreground-muted">{description}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-surface p-6 text-sm text-foreground-muted text-center">
      {message ?? defaults[kind]}
    </div>
  );
}
