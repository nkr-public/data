import { ApiClient } from "./client";
import { ItemDto, ItemRequest, UserResponse } from "./types";

/**
 * L'authentification repose exclusivement sur le cookie HttpOnly de session
 * opaque (app_session), transmis automatiquement par le navigateur
 * (credentials: "include"). Aucun jeton n'est manipule cote frontend.
 */
export function createAuthApi(client: ApiClient) {
  return {
    login: (usernameOrEmail: string, password: string): Promise<UserResponse> =>
      client.post("/api/auth/login", { usernameOrEmail, password }),
    register: (data: {
      username: string;
      email: string;
      phone?: string;
      password: string;
    }): Promise<UserResponse> => client.post("/api/auth/register", data),
    me: (): Promise<UserResponse> => client.get("/api/auth/me"),
    logout: (): Promise<void> => client.post("/api/auth/logout"),
    logoutAll: (): Promise<void> => client.post("/api/auth/logout-all")
  };
}

/** Exemple de service REST : a dupliquer pour chaque nouvelle ressource. */
export function createItemApi(client: ApiClient) {
  return {
    list: (): Promise<ItemDto[]> => client.get("/api/v1/items"),
    getById: (id: string): Promise<ItemDto> => client.get(`/api/v1/items/${id}`),
    create: (data: ItemRequest): Promise<ItemDto> => client.post("/api/v1/items", data),
    update: (id: string, data: ItemRequest): Promise<ItemDto> => client.put(`/api/v1/items/${id}`, data),
    remove: (id: string): Promise<void> => client.delete(`/api/v1/items/${id}`)
  };
}
