"use client";

import * as React from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "app-theme";

function detectSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Gere le theme actif (clair/sombre) : detecte la preference systeme au
 * premier chargement, memorise ensuite le choix explicite de l'utilisateur
 * (localStorage - aucune donnee sensible n'y est stockee).
 */
export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [theme, setThemeState] = React.useState<ThemeMode>("light");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored ?? detectSystemTheme();
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return [theme, setTheme];
}
