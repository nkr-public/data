import React, { useEffect, useRef, useState } from "react";
import { Database, Loader2, Plus, Trash2, X } from "lucide-react";
import { useSchemaContext } from "./SchemaContext";
import { deleteSavedSchema, loadSavedSchemas, saveSchema } from "../lib/savedSchemas";
import { loadSchema } from "../lib/schemaApi";
import type { SavedSchema, SchemaExportRequest } from "../lib/cdmTypes";

const EMPTY_FORM: SchemaExportRequest = {
    type: "mysql",
    url: "",
    username: "",
    password: "",
    schema: ""
};

export function SchemaMenu() {
    const { isMenuOpen, closeMenu, showModel } = useSchemaContext();
    const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
    const [form, setForm] = useState<SchemaExportRequest>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isMenuOpen) {
            setSavedSchemas(loadSavedSchemas());
            setError(null);
        }
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen, closeMenu]);

    if (!isMenuOpen) {
        return null;
    }

    const updateField = (field: keyof SchemaExportRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const runExport = async (request: SchemaExportRequest) => {
        setError(null);
        setLoading(true);
        try {
            const model = await loadSchema(request);
            saveSchema(request);
            showModel(model);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue lors du chargement du schéma");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void runExport(form);
    };

    const handleSelectSaved = (schema: SavedSchema) => {
        void runExport(schema);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteSavedSchema(id);
        setSavedSchemas(loadSavedSchemas());
    };

    return (
        <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 z-[200] w-[calc(100vw-1.5rem)] sm:w-[640px] max-h-[80vh] overflow-y-auto rounded-xl bg-surface shadow-xl border border-border"
        >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                        <Database className="w-5 h-5 text-primary" />
                        <span>Connexion à un schéma</span>
                    </div>
                    <button
                        type="button"
                        onClick={closeMenu}
                        className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 grid gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nouvelle connexion
                        </h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-foreground-muted">Type</span>
                                <select
                                    value={form.type}
                                    onChange={updateField("type")}
                                    className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
                                >
                                    <option value="mysql">MySQL</option>
                                    <option value="oracle">Oracle</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-foreground-muted">URL JDBC</span>
                                <input
                                    required
                                    value={form.url}
                                    onChange={updateField("url")}
                                    placeholder="jdbc:mysql://localhost:3306/mydb"
                                    className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-foreground-muted">Utilisateur</span>
                                <input
                                    required
                                    value={form.username}
                                    onChange={updateField("username")}
                                    className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-foreground-muted">Mot de passe</span>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={updateField("password")}
                                    className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                <span className="text-foreground-muted">Schéma</span>
                                <input
                                    required
                                    value={form.schema}
                                    onChange={updateField("schema")}
                                    className="border border-border rounded-md px-3 py-2 bg-background text-foreground"
                                />
                            </label>

                            {error && <p className="text-sm text-rose-500">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2 font-semibold disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                Se connecter et afficher
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-3">Schémas enregistrés</h3>
                        {savedSchemas.length === 0 && (
                            <p className="text-sm text-foreground-muted">Aucun schéma enregistré pour le moment.</p>
                        )}
                        <ul className="flex flex-col gap-2">
                            {savedSchemas.map((schema) => (
                                <li key={schema.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectSaved(schema)}
                                        disabled={loading}
                                        className="w-full flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 disabled:opacity-60"
                                    >
                                        <span className="flex flex-col">
                                            <span className="font-medium text-foreground">{schema.schema}</span>
                                            <span className="text-xs text-foreground-muted">{schema.type} · {schema.url}</span>
                                        </span>
                                        <Trash2
                                            className="w-4 h-4 text-foreground-muted hover:text-rose-500 shrink-0"
                                            onClick={(e) => handleDelete(schema.id, e)}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
        </div>
    );
}
