'use client'

import React, { useState, useRef, useEffect } from "react";
import { Settings, Info, X, Tag, Clock, Server, Globe, Layers, ChevronRight, ChevronLeft, Sun, Moon, Check } from "lucide-react";
export interface AppInfo {
  appName: string;
  appDescription?: string;
  version: string;
  environment?: string;
  buildDate?: string;
  apiUrl?: string;
  extra?: { label: string; value: string }[];
  versionSubTree?: { label: string; value: string }[];
}
import { useTheme } from "../theme/useTheme";

export interface SettingsMenuProps {
  info?: AppInfo;
  className?: string;
  children?: React.ReactNode;
}

export function SettingsMenu({ info, className = "", children }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"menu" | "theme" | "info">("menu");
  const [theme, setTheme] = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveView("menu");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveView("menu");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const envColor: Record<string, string> = {
    production: "text-green-600 bg-green-50 border-green-200",
    staging: "text-amber-600 bg-amber-50 border-amber-200",
    development: "text-blue-600 bg-blue-50 border-blue-200",
    dev: "text-blue-600 bg-blue-50 border-blue-200",
  };
  const envClass = info?.environment
    ? envColor[info.environment.toLowerCase()] ?? "text-foreground-muted bg-surface border-border"
    : "text-foreground-muted bg-surface border-border";

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (!next) setActiveView("menu");
            return next;
          });
        }}
        aria-label="Paramètres"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center justify-center w-8 h-8 rounded-full text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <Settings className="w-4.5 h-4.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface border border-border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {activeView === "menu" ? (
            <>
              {/* Main Settings Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Paramètres</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveView("menu");
                  }}
                  className="text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Settings Menu Items */}
              <div className="p-2 space-y-1">
                {/* Theme sub-menu item */}
                <button
                  type="button"
                  onClick={() => setActiveView("theme")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span>Thème</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-foreground-muted group-hover:text-primary">
                    <span className="text-[11px] font-normal">{theme === "dark" ? "Sombre" : "Clair"}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>

                {/* Informations sub-menu item */}
                {info && (
                  <button
                    type="button"
                    onClick={() => setActiveView("info")}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-primary shrink-0" />
                      <span>Informations</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
                {children}
              </div>
            </>
          ) : activeView === "theme" ? (
            <>
              {/* Submenu Theme Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
                <button
                  type="button"
                  onClick={() => setActiveView("menu")}
                  className="flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Retour aux paramètres"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <div className="flex items-center gap-1.5">
                  {theme === "dark" ? (
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="text-xs font-bold text-foreground">Thème</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveView("menu");
                  }}
                  className="text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Submenu Theme Options */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                    theme === "light"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sun className={`w-4 h-4 ${theme === "light" ? "text-primary" : "text-amber-500"}`} />
                    <div>
                      <div>Mode clair</div>
                      <div className="text-[10px] text-foreground-muted font-normal">Apparence lumineuse standard</div>
                    </div>
                  </div>
                  {theme === "light" && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                    theme === "dark"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Moon className={`w-4 h-4 ${theme === "dark" ? "text-primary" : "text-amber-400"}`} />
                    <div>
                      <div>Mode sombre</div>
                      <div className="text-[10px] text-foreground-muted font-normal">Apparence sombre reposante</div>
                    </div>
                  </div>
                  {theme === "dark" && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              </div>

              {/* Submenu Footer */}
              <div className="px-4 py-2 border-t border-border bg-background/40 text-[10px] text-foreground-muted text-center">
                Choix enregistré automatiquement
              </div>
            </>
          ) : (
            <>
              {/* Submenu Info Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
                <button
                  type="button"
                  onClick={() => setActiveView("menu")}
                  className="flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Retour aux paramètres"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">{info?.appName || "Informations"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveView("menu");
                  }}
                  className="text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Submenu Info Body */}
              {info && (
                <div className="px-4 py-3 space-y-2.5">
                  {info.appDescription && (
                    <p className="text-xs text-foreground-muted leading-relaxed">{info.appDescription}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground-muted">Version</span>
                    <span className="ml-auto font-mono font-semibold text-foreground">{info.version}</span>
                  </div>

                  {info.versionSubTree && info.versionSubTree.length > 0 && (
                    <div className="flex flex-col ml-[9px] pl-3 -mt-1 pb-0.5">
                      {info.versionSubTree.map((item, index, arr) => {
                        const isLast = index === arr.length - 1;
                        return (
                          <div key={item.label} className="relative flex items-center gap-2 text-xs py-0.5">
                            <span className={`absolute -left-3 top-0 w-0 border-l-2 border-primary/40 ${isLast ? "h-1/2" : "h-full"}`} />
                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 border-t-2 border-primary/40" />
                            <span className="text-foreground-muted/80">{item.label}</span>
                            <span className="ml-auto font-mono text-[11px] text-foreground/60 bg-muted/80 px-1.5 py-0.5 rounded">{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {info.environment && (
                    <div className="flex items-center gap-2 text-xs">
                      <Server className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground-muted">Environnement</span>
                      <span className={`ml-auto font-semibold px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wide ${envClass}`}>
                        {info.environment}
                      </span>
                    </div>
                  )}

                  {info.buildDate && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground-muted">Build</span>
                      <span className="ml-auto font-mono text-foreground">{info.buildDate}</span>
                    </div>
                  )}

                  {info.apiUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground-muted">API</span>
                      <span className="ml-auto font-mono text-foreground truncate max-w-[140px]" title={info.apiUrl}>
                        {info.apiUrl}
                      </span>
                    </div>
                  )}

                  {info.extra?.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <span className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-foreground-muted">{item.label}</span>
                      <span className="ml-auto font-mono text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Submenu Footer */}
              <div className="px-4 py-2 border-t border-border bg-background/40 text-[10px] text-foreground-muted text-center">
                © {new Date().getFullYear()} {info?.appName ?? "App"}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
