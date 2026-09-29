import React, { useEffect, useRef, useState } from "react";
import { Settings2, ChevronDown, List, Search, X } from "lucide-react";

export type DisplayMode = "all" | "name" | "keys";

export interface TableListItem {
    id: string;
    name: string;
}

interface ViewOptionsMenuProps {
    displayMode: DisplayMode;
    onChangeDisplayMode: (mode: DisplayMode) => void;
    tables: TableListItem[];
    onSelectTable: (tableId: string) => void;
}

const MODE_LABELS: Record<DisplayMode, string> = {
    all: "All",
    name: "Name only",
    keys: "Keys only"
};

/**
 * Menu situé en haut à droite du viewer, permettant de choisir le mode
 * d'affichage des tables (All / Name only / Keys only) et d'ouvrir une
 * popup listant les tables du cluster courant.
 */
export function ViewOptionsMenu({ displayMode, onChangeDisplayMode, tables, onSelectTable }: ViewOptionsMenuProps) {
    const [isModeOpen, setIsModeOpen] = useState(false);
    const [isTablesOpen, setIsTablesOpen] = useState(false);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);

    // Fermeture des menus au clic à l'extérieur ou sur Échap
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setIsModeOpen(false);
                setIsTablesOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModeOpen(false);
                setIsTablesOpen(false);
            }
        };
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const filteredTables = tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div
            ref={rootRef}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 30 }}
            className="flex items-center gap-2 select-none"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Bouton Mode */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsModeOpen((prev) => !prev);
                        setIsTablesOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card/95 backdrop-blur border border-border/80 shadow-lg rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                >
                    <Settings2 className="w-3.5 h-3.5 text-primary" />
                    Mode: {MODE_LABELS[displayMode]}
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {isModeOpen && (
                    <div className="absolute right-0 mt-1 min-w-[160px] py-1 bg-card/95 backdrop-blur border border-border/80 shadow-2xl rounded-lg overflow-hidden">
                        {(Object.keys(MODE_LABELS) as DisplayMode[]).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                    onChangeDisplayMode(mode);
                                    setIsModeOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                    mode === displayMode
                                        ? "bg-primary/10 text-foreground font-semibold"
                                        : "text-foreground hover:bg-muted/80"
                                }`}
                            >
                                {MODE_LABELS[mode]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bouton Tables List */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsTablesOpen((prev) => !prev);
                        setIsModeOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card/95 backdrop-blur border border-border/80 shadow-lg rounded-lg text-foreground hover:bg-muted/80 transition-colors"
                >
                    <List className="w-3.5 h-3.5 text-primary" />
                    Tables List
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                {isTablesOpen && (
                    <div className="absolute right-0 mt-1 w-[260px] max-h-[60vh] flex flex-col bg-card/95 backdrop-blur border border-border/80 shadow-2xl rounded-lg overflow-hidden">
                        <div className="relative p-2 border-b border-border/60">
                            <Search className="w-3.5 h-3.5 absolute left-4.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Filtrer les tables..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-7 pr-7 py-1 text-xs bg-background/80 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto py-1">
                            {filteredTables.length === 0 ? (
                                <div className="text-center py-4 text-xs text-muted-foreground">
                                    Aucune table trouvée
                                </div>
                            ) : (
                                filteredTables.map((table) => (
                                    <button
                                        key={table.id}
                                        type="button"
                                        onClick={() => {
                                            onSelectTable(table.id);
                                            setIsTablesOpen(false);
                                            setSearch("");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors truncate"
                                    >
                                        {table.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
