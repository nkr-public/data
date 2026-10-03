/**
 * Les identifiants BIGINT sont representes en string cote TypeScript pour
 * preserver leur precision (JS number est un float 64 bits).
 */

/** Identite et roles de l'utilisateur authentifie (GET /api/auth/me). Jamais de secret. */
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  accountStatus: string;
  roles: string[];
}

/** Ressource d'exemple (voir /api/v1/items). */
export interface ItemDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemRequest {
  name: string;
  description?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  timestamp: string;
}
