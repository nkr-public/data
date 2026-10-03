import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiClient, ApiError } from "./client";
import { createAuthApi } from "./endpoints";
import type { UserResponse } from "./types";

/**
 * Cle de query partagee, source unique du profil, des roles de l'utilisateur authentifie (GET /api/auth/me).
 */
export const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

/**
 * Hook reutilisable centralisant l'utilisateur courant : plus aucun
 * composant ne doit dupliquer son propre appel a /api/auth/me ni son propre
 * etat local. staleTime de 5 minutes, sans polling (refetchInterval: false).
 */
export function useCurrentUser() {
  const authApi = useMemo(() => createAuthApi(createApiClient()), []);

  const query = useQuery<UserResponse, ApiError>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    // Seul un 401 (session absente ou invalide) est un echec definitif
    // d'authentification. Un 403 (droits insuffisants) ou une erreur
    // reseau/serveur ne doit pas etre retente en boucle ni provoquer de
    // deconnexion (voir les evenements app:unauthorized / app:forbidden
    // geres par le client HTTP).
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ?? null,
    isAuthenticated: !!query.data,
  };
}

/**
 * A appeler juste apres une connexion reussie afin d'actualiser
 * immediatement la query commune ["auth", "me"].
 */
export function useRefreshCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
}

/**
 * A appeler apres modification du profil ou des droits de l'utilisateur
 * courant pour invalider la query commune et forcer un rechargement.
 */
export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
}

/**
 * A appeler a la deconnexion ou au changement de compte : annule les
 * requetes privees en cours puis purge l'intégralite du cache TanStack
 * Query afin d'eviter toute donnee residuelle de l'utilisateur precedent.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const authApi = useMemo(() => createAuthApi(createApiClient()), []);
  return async () => {
    await queryClient.cancelQueries();
    try {
      await authApi.logout();
    } finally {
      queryClient.clear();
    }
  };
}
