import React, { useState, useRef, useEffect } from "react";
import { GripVertical, Layers, ChevronDown, ChevronRight, Search, X } from "lucide-react";

export interface ClusterInfo {
    id: number;
    name: string;
    tableIds: string[];
}

interface ClusterMenuProps {
    clusters: ClusterInfo[];
    selectedClusterId: number | null;
    onSelectCluster: (clusterId: number) => void;
}

export function ClusterMenu({ clusters, selectedClusterId, onSelectCluster }: ClusterMenuProps) {
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [search, setSearch] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only drag from header handle
        if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
            return;
        }
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
            const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const filteredClusters = clusters.filter((c) => {
        const query = search.toLowerCase();
        if (c.name.toLowerCase().includes(query)) return true;
        return c.tableIds.some((t) => t.toLowerCase().includes(query));
    });

    return (
        <div
            ref={panelRef}
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 30,
                width: 320,
            }}
            className="flex flex-col bg-card/95 backdrop-blur border border-border/80 shadow-2xl rounded-xl overflow-hidden select-none transition-shadow duration-200"
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between px-3 py-2.5 bg-muted/60 border-b border-border/60 cursor-grab active:cursor-grabbing hover:bg-muted/80 transition-colors"
            >
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Clusters ({clusters.length})</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title={isCollapsed ? "Déplier" : "Replier"}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="flex flex-col p-2 gap-2 max-h-[70vh]">
                    {/* Search bar */}
                    {clusters.length > 5 && (
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filtrer clusters / tables..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-7 py-1 text-xs bg-background/80 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Clusters list */}
                    <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredClusters.length === 0 ? (
                            <div className="text-center py-4 text-xs text-muted-foreground">
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
                                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                                            isSelected
                                                ? "bg-primary/10 border-primary/50 text-foreground shadow-sm"
                                                : "bg-background/40 hover:bg-muted/60 border-border/40 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        isSelected ? "bg-primary" : "bg-muted-foreground/40"
                                                    }`}
                                                />
                                                {cluster.name}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium">
                                                {cluster.tableIds.length} {cluster.tableIds.length > 1 ? "tables" : "table"}
                                            </span>
                                        </div>

                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
