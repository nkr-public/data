import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: ApiErrorBody) {
    super(body.message);
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
}

const CSRF_HEADER_NAME = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/**
 * Cache memoire du jeton CSRF, alimente par l'en-tete de reponse
 * X-XSRF-TOKEN. Aucun cookie CSRF n'est lu ni ecrit par le client.
 */
let cachedCsrfToken: string | null = null;

function getCsrfToken(): string | null {
  return cachedCsrfToken;
}

function resolveBaseUrl(configBaseUrl?: string): string {
  const envBaseUrl =
    typeof process !== "undefined" && process.env
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL)
      : undefined;
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;
  return (
    configBaseUrl ??
    (typeof window !== "undefined" && !isTauri
      ? (envBaseUrl ?? "")
      : (envBaseUrl ?? "http://127.0.0.1:8080"))
  );
}

export function createApiClient(config?: ApiClientConfig) {
  const baseUrl = resolveBaseUrl(config?.baseUrl);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const method = (init?.method ?? "GET").toUpperCase();
    if (!SAFE_METHODS.has(method) && !headers.has(CSRF_HEADER_NAME)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers.set(CSRF_HEADER_NAME, csrfToken);
      }
    }
    let response: Response;
    try {
      // La session est transportee exclusivement via le cookie HttpOnly
      // app_session : "credentials: include" est indispensable, y compris
      // en environnement Tauri (webview) ou le frontend et le backend sont
      // sur des "sites" differents.
      response = await fetch(`${baseUrl}${path}`, { ...init, headers, credentials: "include" });
    } catch {
      throw new ApiError(0, { code: "NETWORK_ERROR", message: "Connexion impossible au serveur", timestamp: new Date().toISOString() });
    }
    // Met a jour le cache memoire du jeton CSRF depuis l'en-tete de reponse
    // associe a la session cote backend.
    const freshCsrfToken = response.headers.get(CSRF_HEADER_NAME);
    if (freshCsrfToken) {
      cachedCsrfToken = freshCsrfToken;
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
      if (response.status === 401) {
        cachedCsrfToken = null;
        // 401 : session absente ou invalide -> l'appelant (AuthGuard, etc.)
        // est responsable de rediriger vers /login. On ne tente plus de
        // rafraichir un jeton : il n'existe plus de mecanisme de refresh.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("app:unauthorized"));
        }
      } else if (response.status === 403) {
        // 403 : accès refusé, ne déconnecte pas l'utilisateur.
        // On affiche uniquement une notification in-app claire (pas de notification
        // native du système d'exploitation, ex. Windows 11).
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("app:forbidden", {
              detail: { message: body?.message ?? "Accès refusé : vous n'avez pas les droits nécessaires pour effectuer cette action." },
            })
          );
        }
      }
      throw new ApiError(response.status, body ?? { code: "UNKNOWN_ERROR", message: "Erreur inconnue", timestamp: new Date().toISOString() });
    }
    if (response.status === 204) {
      if (path === "/api/auth/logout" || path === "/api/auth/logout-all") {
        cachedCsrfToken = null;
      }
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  return {
    request,
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
