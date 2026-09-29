import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
    applyNodeChanges,
    Background,
    type Edge,
    type Node,
    type NodeChange,
    ReactFlowProvider,
    useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";
import { useSchemaContext } from "./SchemaContext";
import { TableNode, type TableNodeData } from "./TableNode";
import { RelationEdge } from "./RelationEdge";
import { assignEdgeHandles, layoutGraph } from "@/lib/elkLayout";
import { type ClusterInfo } from "./ClusterMenu";
import { DependencyPopup } from "./DependencyPopup";
import { type DisplayMode } from "./ViewOptionsMenu";
import { SchemaSidebar } from "./SchemaSidebar";
import type { Relation } from "@/lib/cdmTypes";

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge, smoothstep: RelationEdge };

/**
 * En mode "Keys only", on affiche les identifiants (ids), les identifiants
 * externes (external ids) ainsi que les colonnes référencées par d'autres tables.
 */
const KEY_COLUMN_CATEGORIES = new Set(["id", "external"]);

/** Couleur des liaisons et tables "allumées" (survolées). */
const HIGHLIGHT_COLOR = "#f59e0b";
/**
 * Ordre d'empilement des éléments allumés : au-dessus de tout le reste, avec
 * les liaisons au-dessus des tables. React Flow dessine la couche des liaisons
 * avant celle des nœuds, donc à z-index égal une table masquerait la liaison.
 * Le libellé est dessiné dans le même groupe SVG que le tracé, après lui, et se
 * retrouve donc toujours au-dessus du trait.
 */
const HIGHLIGHT_NODE_Z_INDEX = 1000;
const HIGHLIGHT_EDGE_Z_INDEX = HIGHLIGHT_NODE_Z_INDEX + 1;

interface Highlight {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
}

const EMPTY_HIGHLIGHT: Highlight = { nodeIds: new Set(), edgeIds: new Set() };

/** Menu contextuel ouvert par clic droit sur l'en-tête d'une table. */
interface NodeContextMenu {
    nodeId: string;
    x: number;
    y: number;
}

function SchemaViewerInner() {
    const { model } = useSchemaContext();
    const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
    const [nodes, setNodes] = useState<Node<TableNodeData>[]>([]);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<NodeContextMenu | null>(null);
    const [dependencyTableId, setDependencyTableId] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
    const [locked, setLocked] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { fitView, setCenter, getNode } = useReactFlow();

    const clusters: ClusterInfo[] = useMemo(() => {
        if (!model) return [];
        if (model.clusters && model.clusters.length > 0) {
            return model.clusters.map((clusterTables, index) => ({
                id: index,
                name:  index === model!.clusters!.length - 1
                ? "Orphans Tables"
                : `Cluster ${index + 1}`,
                tableIds: clusterTables
            }));
        }
        // Fallback si pas de clusters renseignés
        return [
            {
                id: 0,
                name: "Tous les éléments",
                tableIds: model.tables.map((t) => t.id)
            }
        ];
    }, [model]);

    // Initialisation ou mise à jour du cluster sélectionné
    useEffect(() => {
        if (clusters.length > 0) {
            setSelectedClusterId((prev) => {
                if (prev !== null && clusters.some((c) => c.id === prev)) {
                    return prev;
                }
                return clusters[0].id;
            });
        } else {
            setSelectedClusterId(null);
        }
    }, [clusters]);

    // Ensemble des tables du cluster sélectionné
    const currentClusterTableSet = useMemo(() => {
        if (!model || selectedClusterId === null) return new Set<string>();
        const targetCluster = clusters.find((c) => c.id === selectedClusterId);
        if (!targetCluster) return new Set<string>();
        return new Set(targetCluster.tableIds);
    }, [model, clusters, selectedClusterId]);

    // Filtrage des relations appartenant au cluster sélectionné
    const edges: Edge[] = useMemo(() => {
        if (!model || currentClusterTableSet.size === 0) return [];
        const tableMap = new Map(model.tables.map((t) => [t.id, t.table]));

        return model.relations
            .filter(
                (rel) =>
                    currentClusterTableSet.has(rel.sourceTable) &&
                    currentClusterTableSet.has(rel.targetTable)
            )
            .map((relation) => {
                const sourceTableName = tableMap.get(relation.sourceTable) ?? relation.sourceTable;
                const targetTableName = tableMap.get(relation.targetTable) ?? relation.targetTable;
                const sourceCols =
                    relation.sourceColumns && relation.sourceColumns.length > 0
                        ? relation.sourceColumns.join(", ")
                        : "";
                const targetCols =
                    relation.targetColumns && relation.targetColumns.length > 0
                        ? relation.targetColumns.join(", ")
                        : "";

                const sourceText = sourceCols ? `${sourceTableName}:${sourceCols}` : sourceTableName;
                const targetText = targetCols ? `${targetTableName}:${targetCols}` : targetTableName;
                const cardinality =
                    relation.cardinality ||
                    (relation.sourceCardinality && relation.targetCardinality
                        ? `${relation.sourceCardinality}:${relation.targetCardinality}`
                        : "");

                const label = (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight text-[#ffeb3b] bg-black border border-[#ffeb3b]/60 rounded-md px-2 py-1 shadow-lg backdrop-blur-sm">
                        {cardinality ? (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#ffeb3b]/20 text-[#ffeb3b] border border-[#ffeb3b]/40 shrink-0">
                                {cardinality}
                            </span>
                        ) : null}
                        <div className="flex flex-col items-start justify-center">
                            <span className="whitespace-nowrap">{sourceText}</span>
                            <div className="w-full border-t border-[#ffeb3b]/30 my-0.5" />
                            <span className="whitespace-nowrap">{targetText}</span>
                        </div>
                    </div>
                );

                return {
                    id: relation.id,
                    source: relation.sourceTable,
                    target: relation.targetTable,
                    animated: false,
                    type: "smoothstep",
                    label
                };
            });
    }, [model, currentClusterTableSet]);

    // Colonnes de chaque table référencées par une relation du cluster courant
    // (clés étrangères côté source ou cible). Elles doivent rester visibles en
    // mode "Keys only".
    const referencedColumnsByTable = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (!model || currentClusterTableSet.size === 0) return map;
        const add = (tableId: string, columns?: string[]) => {
            if (!columns || columns.length === 0) return;
            let set = map.get(tableId);
            if (!set) {
                set = new Set<string>();
                map.set(tableId, set);
            }
            for (const column of columns) set.add(column);
        };
        for (const rel of model.relations) {
            if (
                !currentClusterTableSet.has(rel.sourceTable) ||
                !currentClusterTableSet.has(rel.targetTable)
            ) {
                continue;
            }
            add(rel.sourceTable, rel.sourceColumns);
            add(rel.targetTable, rel.targetColumns);
        }
        return map;
    }, [model, currentClusterTableSet]);

    // Zone du graphe "allumée" : la table survolée, ses liaisons et les tables
    // associées, ou bien la liaison survolée et ses deux tables.
    const highlight: Highlight = useMemo(() => {
        if (hoveredNodeId !== null) {
            const nodeIds = new Set<string>([hoveredNodeId]);
            const edgeIds = new Set<string>();
            for (const edge of edges) {
                if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
                    edgeIds.add(edge.id);
                    nodeIds.add(edge.source);
                    nodeIds.add(edge.target);
                }
            }
            return { nodeIds, edgeIds };
        }
        if (hoveredEdgeId !== null) {
            const edge = edges.find((e) => e.id === hoveredEdgeId);
            if (edge) {
                return {
                    nodeIds: new Set([edge.source, edge.target]),
                    edgeIds: new Set([edge.id])
                };
            }
        }
        return EMPTY_HIGHLIGHT;
    }, [edges, hoveredNodeId, hoveredEdgeId]);

    const isHighlightActive = highlight.edgeIds.size > 0 || highlight.nodeIds.size > 0;

    // Nœuds affichés : état allumé/atténué et mode d'affichage injectés dans les données
    const displayNodes: Node<TableNodeData>[] = useMemo(
        () =>
            nodes.map((node) => {
                const highlighted = highlight.nodeIds.has(node.id);
                const dimmed = isHighlightActive && !highlighted;
                if (
                    !node.data.highlighted === !highlighted &&
                    !node.data.dimmed === !dimmed &&
                    node.data.displayMode === displayMode
                ) {
                    return node;
                }
                return {
                    ...node,
                    zIndex: highlighted ? HIGHLIGHT_NODE_Z_INDEX : undefined,
                    data: { ...node.data, highlighted, dimmed, displayMode }
                };
            }),
        [nodes, highlight, isHighlightActive, displayMode]
    );

    // Liaisons affichées : handles choisis selon la position courante des
    // tables, libellé visible uniquement lorsque la liaison est allumée.
    const displayEdges: Edge[] = useMemo(
        () =>
            assignEdgeHandles(nodes, edges).map((edge) => {
                const highlighted = highlight.edgeIds.has(edge.id);
                return {
                    ...edge,
                    label: highlighted ? edge.label : undefined,
                    zIndex: highlighted ? HIGHLIGHT_EDGE_Z_INDEX : undefined,
                    interactionWidth: 20,
                    style: highlighted
                        ? { stroke: HIGHLIGHT_COLOR, strokeWidth: 2.5 }
                        : { opacity: isHighlightActive ? 0.25 : 1 },
                    labelBgPadding: [4, 2] as [number, number],
                    labelBgBorderRadius: 2,
                    labelStyle: { fontSize: 11, fontWeight: 600, fill: "#ffeb3b" },
                    labelBgStyle: { fill: "#000000", fillOpacity: 0.95 }
                };
            }),
        [nodes, edges, highlight, isHighlightActive]
    );

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((current) => applyNodeChanges(changes, current) as Node<TableNodeData>[]);
    }, []);

    const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
        setHoveredNodeId(node.id);
    }, []);
    const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);
    const onEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
        setHoveredEdgeId(edge.id);
    }, []);
    const onEdgeMouseLeave = useCallback(() => setHoveredEdgeId(null), []);

    // Clic droit sur une table : le menu n'est ouvert que depuis l'en-tête.
    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        const target = event.target as HTMLElement | null;
        if (!target?.closest("[data-table-header]")) {
            setContextMenu(null);
            return;
        }
        const rect = containerRef.current?.getBoundingClientRect();
        setContextMenu({
            nodeId: node.id,
            x: event.clientX - (rect?.left ?? 0),
            y: event.clientY - (rect?.top ?? 0)
        });
    }, []);
    const closeContextMenu = useCallback(() => setContextMenu(null), []);
    const closeDependencyPopup = useCallback(() => setDependencyTableId(null), []);

    // Fermeture du menu contextuel au clic ailleurs ou sur Échap
    useEffect(() => {
        if (!contextMenu) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setContextMenu(null);
        };
        window.addEventListener("mousedown", closeContextMenu);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("mousedown", closeContextMenu);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [contextMenu, closeContextMenu]);

    // Mise en page du cluster sélectionné
    useEffect(() => {
        setHoveredNodeId(null);
        setHoveredEdgeId(null);
        setContextMenu(null);
        if (!model || currentClusterTableSet.size === 0) {
            setNodes([]);
            return;
        }

        const filteredTables = model.tables.filter((t) => currentClusterTableSet.has(t.id));

        const baseNodes: Node<TableNodeData>[] = filteredTables.map((table) => {
            const referenced = referencedColumnsByTable.get(table.id);
            const columns =
                displayMode === "name"
                    ? []
                    : displayMode === "keys"
                        ? table.columns.filter(
                              (column) =>
                                  KEY_COLUMN_CATEGORIES.has(column.category) ||
                                  (referenced?.has(column.name) ?? false)
                          )
                        : table.columns;
            return {
                id: table.id,
                type: "table",
                position: { x: 0, y: 0 },
                data: { table: table.table, nbRows: table.nbRows, columns }
            };
        });

        const rect = containerRef.current?.getBoundingClientRect();
        const viewerDimensions = rect
            ? { width: rect.width, height: rect.height }
            : { width: window.innerWidth, height: window.innerHeight };

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        layoutGraph(baseNodes, edges, viewerDimensions).then((laidOut) => {
            if (cancelled) return;
            setNodes(laidOut as Node<TableNodeData>[]);

            // Recentrage sur le cluster
            timeoutId = setTimeout(() => {
                fitView({ padding: 0.02, duration: 300 });
            }, 50);
        });

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [model, currentClusterTableSet, edges, fitView, displayMode, referencedColumnsByTable]);

    const handleSelectCluster = (clusterId: number) => {
        setSelectedClusterId(clusterId);
    };

    // Liste des tables du cluster courant, pour la popup "Tables List".
    const tableListItems = useMemo(() => {
        if (!model) return [];
        return model.tables
            .filter((t) => currentClusterTableSet.has(t.id))
            .map((t) => ({ id: t.id, name: t.table }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [model, currentClusterTableSet]);

    // Nom du cluster sélectionné, affiché en haut au centre du viewer.
    const selectedClusterName = useMemo(() => {
        if (selectedClusterId === null) return null;
        return clusters.find((c) => c.id === selectedClusterId)?.name ?? null;
    }, [clusters, selectedClusterId]);

    // Sélection d'une table depuis la popup : centrage de la vue sur celle-ci.
    const handleSelectTable = useCallback(
        (tableId: string) => {
            const node = getNode(tableId);
            if (!node) return;
            const width = node.width ?? 240;
            const height = node.height ?? 120;
            setCenter(node.position.x + width / 2, node.position.y + height / 2, {
                zoom: 1,
                duration: 300
            });
            setHoveredNodeId(tableId);
            setTimeout(() => setHoveredNodeId((current) => (current === tableId ? null : current)), 1500);
        },
        [getNode, setCenter]
    );

    if (!model) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-background flex overflow-hidden">
            <div className="relative flex-1 h-full">
                {selectedClusterName && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className="px-4 py-1 bg-card/90 backdrop-blur border border-border/90 shadow-lg bg-gray-600 rounded-2xl text-md font-semibold text-foreground">
                            {selectedClusterName}
                        </span>
                    </div>
                )}
                <ReactFlow
                    nodes={displayNodes}
                    edges={displayEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onNodeMouseEnter={onNodeMouseEnter}
                    onNodeMouseLeave={onNodeMouseLeave}
                    onEdgeMouseEnter={onEdgeMouseEnter}
                    onEdgeMouseLeave={onEdgeMouseLeave}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneClick={closeContextMenu}
                    nodesDraggable={!locked}
                    nodesConnectable={false}
                    elevateNodesOnSelect={false}
                    fitView
                    minZoom={0.01}
                    maxZoom={Infinity}
                    style={{ width: "100%", height: "100%" }}
                >
                    <Background />
                </ReactFlow>
            </div>

            <SchemaSidebar
                clusters={clusters}
                selectedClusterId={selectedClusterId}
                onSelectCluster={handleSelectCluster}
                displayMode={displayMode}
                onChangeDisplayMode={setDisplayMode}
                tables={tableListItems}
                onSelectTable={handleSelectTable}
                locked={locked}
                onToggleLock={() => setLocked((prev) => !prev)}
            />

            {contextMenu && (
                <div
                    style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y, zIndex: 40 }}
                    className="min-w-[200px] py-1 bg-card/95 backdrop-blur border border-border/80 shadow-2xl rounded-lg overflow-hidden select-none"
                    onMouseDown={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setDependencyTableId(contextMenu.nodeId);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors"
                    >
                        Display dependency only
                    </button>
                </div>
            )}

            {dependencyTableId && (
                <DependencyPopup tableId={dependencyTableId} onClose={closeDependencyPopup} />
            )}
        </div>
    );
}

export function SchemaViewer() {
    return (
        <ReactFlowProvider>
            <SchemaViewerInner />
        </ReactFlowProvider>
    );
}
