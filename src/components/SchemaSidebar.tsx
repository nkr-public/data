import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Layers,
    Settings2,
    List,
    Search,
    X,
    ZoomIn,
    ZoomOut,
    Maximize,
    Lock,
    Unlock,
    type LucideIcon
} from "lucide-react";
import { useReactFlow } from "reactflow";
import type { ClusterInfo } from "./ClusterMenu";
import type { DisplayMode, TableListItem } from "./ViewOptionsMenu";

type PanelId = "cluster" | "mode" | "tables";

interface SidebarButton {
    id: PanelId;
    label: string;
    icon: LucideIcon;
}

const SIDEBAR_BUTTONS: SidebarButton[] = [
    { id: "cluster", label: "Clusters", icon: Layers },
    { id: "mode", label: "Mode d'affichage", icon: Settings2 },
    { id: "tables", label: "Liste des tables", icon: List }
];

const MODE_LABELS: Record<DisplayMode, string> = {
    all: "All",
    name: "Name only",
    keys: "Keys only"
};

interface SchemaSidebarProps {
    clusters: ClusterInfo[];
    selectedClusterId: number | null;
    onSelectCluster: (clusterId: number) => void;
    displayMode: DisplayMode;
    onChangeDisplayMode: (mode: DisplayMode) => void;
    tables: TableListItem[];
    onSelectTable: (tableId: string) => void;
    locked: boolean;
    onToggleLock: () => void;
}

/** Largeur de la barre laterale, en pixels. */
const BAR_WIDTH = 48;

/**
 * Barre laterale droite (48px) regroupant en haut les boutons-icones
 * (clusters, mode, liste des tables) qui ouvrent des tiroirs (drawers) animes
 * sur la gauche de la barre et mutuellement exclusifs, et en bas les controles
 * de navigation du graphe restyles pour rester homogenes avec le reste de l'interface.
 */
export function SchemaSidebar({
    clusters,
    selectedClusterId,
    onSelectCluster,
    displayMode,
    onChangeDisplayMode,
    tables,
    onSelectTable,
    locked,
    onToggleLock
}: SchemaSidebarProps) {
    const [activePanel, setActivePanel] = useState<PanelId | null>(null);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const togglePanel = (panel: PanelId) => {
        setSearch("");
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    const closePanel = () => setActivePanel(null);

    // Fermeture au clic exterieur ou sur Echap.
    useEffect(() => {
        if (!activePanel) return;
        const handleMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                closePanel();
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePanel();
        };
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activePanel]);

    const filteredClusters = useMemo(() => {
        const query = search.toLowerCase();
        if (!query) return clusters;
        return clusters.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                c.tableIds.some((t) => t.toLowerCase().includes(query))
        );
    }, [clusters, search]);

    const filteredTables = useMemo(() => {
        const query = search.toLowerCase();
        if (!query) return tables;
        return tables.filter((t) => t.name.toLowerCase().includes(query));
    }, [tables, search]);

    const panelTitle = activePanel
        ? SIDEBAR_BUTTONS.find((b) => b.id === activePanel)?.label ?? ""
        : "";

    return (
        <div
            ref={rootRef}
            className="relative h-full z-30 flex select-none"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Drawer anime (a gauche de la barre laterale droite) */}
            {activePanel && (
                <div
                    key={activePanel}
                    style={{ right: BAR_WIDTH }}
                    className="animate-sidebar-panel absolute top-0 bottom-0 w-[300px] flex flex-col bg-surface/95 backdrop-blur shadow-2xl border-l border-r border-border/40 z-20 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-3 py-3 bg-background/50 border-b border-border/40">
                        <span className="text-sm font-semibold text-foreground">{panelTitle}</span>
                        <button
                            type="button"
                            onClick={closePanel}
                            className="p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-background/60 transition-colors"
                            title="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Barre de recherche (clusters / tables) */}
                    {(activePanel === "cluster" || activePanel === "tables") && (
                        <div className="relative px-3 pt-3 pb-1 border-b border-border/20">
                            <Search className="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground-muted" />
                            <input
                                type="text"
                                autoFocus
                                placeholder={
                                    activePanel === "cluster"
                                        ? "Filtrer clusters / tables..."
                                        : "Filtrer les tables..."
                                }
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-background/70 rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary border border-border/40"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {activePanel === "cluster" && (
                            <div className="space-y-1.5">
                                {filteredClusters.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-foreground-muted">
                                        Aucun cluster trouvé
                                    </div>
                                ) : (
                                    filteredClusters.map((cluster) => {
                                        const isSelected = selectedClusterId === cluster.id;
                                        return (
                                            <button
                                                key={cluster.id}
                                                type="button"
                                                onClick={() => onSelectCluster(cluster.id)}
                                                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                                                    isSelected
                                                        ? "bg-primary/15 text-foreground ring-1 ring-primary/40 font-medium"
                                                        : "bg-background/40 hover:bg-background/70 text-foreground-muted hover:text-foreground"
                                                }`}
                                            >
                                                <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                                    <span
                                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                                            isSelected ? "bg-primary" : "bg-foreground-muted/40"
                                                        }`}
                                                    />
                                                    <span className="truncate">{cluster.name}</span>
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/70 font-medium shrink-0">
                                                    {cluster.tableIds.length}{" "}
                                                    {cluster.tableIds.length > 1 ? "tables" : "table"}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activePanel === "mode" && (
                            <div className="space-y-1.5">
                                {(Object.keys(MODE_LABELS) as DisplayMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => onChangeDisplayMode(mode)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                                            mode === displayMode
                                                ? "bg-primary/15 text-foreground font-semibold ring-1 ring-primary/40"
                                                : "bg-background/40 hover:bg-background/70 text-foreground-muted hover:text-foreground"
                                        }`}
                                    >
                                        {MODE_LABELS[mode]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {activePanel === "tables" && (
                            <div className="space-y-1">
                                {filteredTables.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-foreground-muted">
                                        Aucune table trouvée
                                    </div>
                                ) : (
                                    filteredTables.map((table) => (
                                        <button
                                            key={table.id}
                                            type="button"
                                            onClick={() => {
                                                onSelectTable(table.id);
                                                closePanel();
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-md text-xs text-foreground hover:bg-background/70 transition-colors truncate"
                                        >
                                            {table.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Barre verticale 48px */}
            <div
                style={{ width: BAR_WIDTH }}
                className="h-full flex flex-col items-center justify-between py-3 bg-surface/95 backdrop-blur border-l border-border/40 shadow-primary z-30"
            >
                {/* Groupe du haut : boutons-icones */}
                <div className="flex flex-col items-center gap-1.5">
                    {SIDEBAR_BUTTONS.map(({ id, label, icon: Icon }) => {
                        const isActive = activePanel === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                title={label}
                                onClick={() => togglePanel(id)}
                                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground-muted hover:text-foreground hover:bg-background/60"
                                }`}
                            >
                                <Icon className="w-4.5 h-4.5" />
                            </button>
                        );
                    })}
                </div>

                {/* Groupe du bas : controles du graphe restyles */}
                <div className="flex flex-col items-center gap-1.5">
                    <button
                        type="button"
                        title="Zoom avant"
                        onClick={() => zoomIn({ duration: 200 })}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background/60 transition-colors"
                    >
                        <ZoomIn className="w-4.5 h-4.5" />
                    </button>
                    <button
                        type="button"
                        title="Zoom arrière"
                        onClick={() => zoomOut({ duration: 200 })}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background/60 transition-colors"
                    >
                        <ZoomOut className="w-4.5 h-4.5" />
                    </button>
                    <button
                        type="button"
                        title="Ajuster à la vue"
                        onClick={() => fitView({ padding: 0.02, duration: 300 })}
                        className="flex items-center justify-center w-9 h-9 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background/60 transition-colors"
                    >
                        <Maximize className="w-4.5 h-4.5" />
                    </button>
                    <button
                        type="button"
                        title={locked ? "Déverrouiller le graphe" : "Verrouiller le graphe"}
                        onClick={onToggleLock}
                        className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                            locked
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground-muted hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        {locked ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
