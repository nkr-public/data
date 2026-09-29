import type { SavedSchema, SchemaExportRequest } from "./cdmTypes";

const STORAGE_KEY = "cdmviewer.savedSchemas";

export function loadSavedSchemas(): SavedSchema[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function persist(schemas: SavedSchema[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas));
}

export function saveSchema(request: SchemaExportRequest): SavedSchema {
    const schemas = loadSavedSchemas();
    const label = `${request.type} - ${request.schema} (${request.url})`;
    const existing = schemas.find(
        (s) => s.type === request.type && s.url === request.url && s.schema === request.schema && s.username === request.username
    );

    const saved: SavedSchema = existing
        ? { ...existing, ...request, label }
        : { ...request, id: crypto.randomUUID(), label };

    const next = existing
        ? schemas.map((s) => (s.id === saved.id ? saved : s))
        : [...schemas, saved];

    persist(next);
    return saved;
}

export function deleteSavedSchema(id: string) {
    const next = loadSavedSchemas().filter((s) => s.id !== id);
    persist(next);
}
