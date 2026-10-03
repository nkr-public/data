"use client";

import * as React from "react";

export type AppEnv = "production" | "development" | "unknown";

export interface AppCache {
  isTauri: boolean;
  isConnected: boolean;
  env: AppEnv;
  isProd: boolean;
  isDev: boolean;
}

// Module-level singleton so the detected values are computed once
let _cache: AppCache | null = null;

function detectIsTauri(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).isTauri ||
      (window as any).__TAURI_INTERNALS__ ||
      (window as any).__TAURI__
  );
}

function detectEnv(envOverride?: string): AppEnv {
  const raw = (
    envOverride ??
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV : undefined) ??
    ""
  ).toLowerCase();

  if (["prod", "production"].includes(raw)) return "production";
  if (["dev", "development"].includes(raw)) return "development";
  return "unknown";
}

function buildCache(isConnected: boolean, envOverride?: string): AppCache {
  const isTauri = detectIsTauri();
  const env = detectEnv(envOverride);
  return {
    isTauri,
    isConnected,
    env,
    isProd: env === "production",
    isDev: env === "development",
  };
}

// ─── Context ────────────────────────────────────────────────────────────────

const AppCacheContext = React.createContext<AppCache | null>(null);

export interface AppCacheProviderProps {
  isConnected: boolean;
  envOverride?: string;
  children: React.ReactNode;
}

/**
 * Place this provider near the root of your app (e.g. in a layout or _app).
 * Any component in the tree can then call `useAppCache()` with no arguments.
 */
export function AppCacheProvider({ isConnected, envOverride, children }: AppCacheProviderProps) {
  const [cache, setCache] = React.useState<AppCache>(() => {
    // Always start with isTauri: false to match SSR and avoid hydration mismatch
    const env = detectEnv(envOverride);
    return { isTauri: false, isConnected, env, isProd: env === "production", isDev: env === "development" };
  });

  React.useEffect(() => {
    const next = buildCache(isConnected, envOverride);
    _cache = next;
    setCache(next);
  }, [isConnected, envOverride]);

  return React.createElement(AppCacheContext.Provider, { value: cache }, children);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns a reactive snapshot of the shared app cache.
 *
 * When called inside an `<AppCacheProvider>` tree, no arguments are needed.
 * When called outside a provider (legacy / standalone usage), pass `isConnected`
 * and an optional `envOverride` to compute the cache locally.
 *
 * @param isConnected - whether the user currently has a valid session/token
 * @param envOverride - optional environment string that takes precedence over process.env values
 */
export function useAppCache(isConnected?: boolean, envOverride?: string): AppCache {
  const ctx = React.useContext(AppCacheContext);

  // Local state used only when there is no provider in the tree
  const [localCache, setLocalCache] = React.useState<AppCache>(() => {
    if (ctx !== null) return ctx; // will be overridden by context path below
    const connected = isConnected ?? false;
    // Always start with isTauri: false to match SSR and avoid hydration mismatch
    const env = detectEnv(envOverride);
    return { isTauri: false, isConnected: connected, env, isProd: env === "production", isDev: env === "development" };
  });

  React.useEffect(() => {
    if (ctx !== null) return; // provider handles updates
    const next = buildCache(isConnected ?? false, envOverride);
    _cache = next;
    setLocalCache(next);
  }, [ctx, isConnected, envOverride]);

  // If a provider is present, always use its value
  if (ctx !== null) return ctx;

  return localCache;
}

/**
 * Read the last computed cache snapshot synchronously (outside React).
 * Returns null if the hook has never been mounted.
 */
export function getAppCache(): AppCache | null {
  return _cache;
}
