"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";

export interface UserMenuProps {
  user: {
    username: string;
    email?: string;
    role?: string;
  };
  onLogout: () => void;
  className?: string;
}

export function UserMenu({ user, onLogout, className = "" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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

  const initials = (user.username || "U").substring(0, 2).toUpperCase();

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu utilisateur"
        className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full bg-surface border border-border hover:bg-border/30 text-xs font-semibold transition-all cursor-pointer select-none"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-foreground leading-tight">{user.username}</div>
          {user.role && (
            <div className="text-[10px] text-foreground-muted font-normal leading-none mt-0.5">
              {user.role}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2.5 mb-1 rounded-xl bg-background/60 border border-border/40">
            <div className="font-semibold text-xs text-foreground truncate">{user.username}</div>
            {user.email && (
              <div className="text-[11px] text-foreground-muted truncate">{user.email}</div>
            )}
            {user.role && (
              <div className="mt-1 inline-block text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {user.role}
              </div>
            )}
          </div>

          <div className="h-px bg-border my-1" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 text-danger" />
            <span>Se déconnecter</span>
          </button>
        </div>
      )}
    </div>
  );
}
