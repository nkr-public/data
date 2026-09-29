import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
    applyNodeChanges,
    Background,
    Controls,
    type Edge,
    type Node,
    type NodeChange,
    ReactFlowProvider,
    useReactFlow
} from "reactflow";
import { X } from "lucide-react";
import { useSchemaContext } from "./SchemaContext";
import { TableNode, type TableNodeData } from "./TableNode";
import { RelationEdge } from "./RelationEdge";
import { assignEdgeHandles, layoutGraph } from "@/lib/elkLayout";

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge, smoothstep: RelationEdge };

/** Seules les colonnes de ces catégories sont affichées dans les tables. */
const VISIBLE_COLUMN_CATEGORIES = new Set(["id", "external"]);

/** Couleur des liaisons et tables "allumées" (survolées). */
const HIGHLIGHT_COLOR = "#f59e0b";
const HIGHLIGHT_NODE_Z_INDEX = 1000;
const HIGHLIGHT_EDGE_Z_INDEX = HIGHLIGHT_NODE_Z_INDEX + 1;

interface Highlight {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
}

const EMPTY_HIGHLIGHT: Highlight = { nodeIds: new Set(), edgeIds: new Set() };

interface DependencyPopupProps {
    /** Identifiant de la table dont on affiche les dépendances directes. */
    tableId: string;
    onClose: () => void;
}

function DependencyPopupInner({ tableId, onClose }: DependencyPopupProps) {
    const { model } = useSchemaContext();
    const [nodes, setNodes] = useState<Node<TableNodeData>[]>([]);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { fitView } = useReactFlow();

    // Liaisons directes de la table : toutes les relations dont elle est
    // source ou cible, quel que soit le cluster.
    const edges: Edge[] = useMemo(() => {
        if (!model) return [];
        const tableMap = new Map(model.tables.map((t) => [t.id, t.table]));

        return model.relations
            .filter((rel) => rel.sourceTable === tableId || rel.targetTable === tableId)
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
    }, [model, tableId]);

    // Tables affichées : la table sélectionnée et ses voisines directes.
    const tableIds = useMemo(() => {
        const ids = new Set<string>([tableId]);
        for (const edge of edges) {
            ids.add(edge.source);
            ids.add(edge.target);
        }
        return ids;
    }, [edges, tableId]);

    // Zone du graphe "allumée" au survol : mêmes règles que le viewer principal.
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

    // Nœuds affichés : la table d'origine reste allumée hors survol.
    const displayNodes: Node<TableNodeData>[] = useMemo(
        () =>
            nodes.map((node) => {
                const highlighted = isHighlightActive ? highlight.nodeIds.has(node.id) : node.id === tableId;
                const dimmed = isHighlightActive && !highlighted;
                if (!node.data.highlighted === !highlighted && !node.data.dimmed === !dimmed) {
                    return node;
                }
                return {
                    ...node,
                    zIndex: highlighted ? HIGHLIGHT_NODE_Z_INDEX : undefined,
                    data: { ...node.data, highlighted, dimmed }
                };
            }),
        [nodes, highlight, isHighlightActive, tableId]
    );

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
                    labelBgBorderRadius: 4,
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

    // Fermeture au clavier (Échap)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Mise en page de la table et de ses voisines
    useEffect(() => {
        setHoveredNodeId(null);
        setHoveredEdgeId(null);
        if (!model) {
            setNodes([]);
            return;
        }

        const baseNodes: Node<TableNodeData>[] = model.tables
            .filter((t) => tableIds.has(t.id))
            .map((table) => ({
                id: table.id,
                type: "table",
                position: { x: 0, y: 0 },
                data: {
                    table: table.table,
                    nbRows: table.nbRows,
                    columns: table.columns.filter((column) => VISIBLE_COLUMN_CATEGORIES.has(column.category))
                }
            }));

        const rect = containerRef.current?.getBoundingClientRect();
        const viewerDimensions = rect
            ? { width: rect.width, height: rect.height }
            : { width: window.innerWidth * 0.95, height: window.innerHeight * 0.95 };

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        layoutGraph(baseNodes, edges, viewerDimensions).then((laidOut) => {
            if (cancelled) return;
            setNodes(laidOut as Node<TableNodeData>[]);
            timeoutId = setTimeout(() => {
                fitView({ padding: 0.05, duration: 300 });
            }, 50);
        });

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [model, tableIds, edges, fitView]);

    const tableName = model?.tables.find((t) => t.id === tableId)?.table ?? tableId;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="relative flex flex-col bg-background border border-border/80 rounded-xl shadow-2xl overflow-hidden"
                style={{ width: "95%", height: "95%" }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Barre de titre : titre centré, bouton de fermeture à droite */}
                <div className="relative flex items-center justify-center px-12 py-2.5 border-b border-border/60 bg-muted/60 shrink-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                        {tableName} dependencies
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Close"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div ref={containerRef} className="relative flex-1 min-h-0">
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
                        nodesDraggable
                        nodesConnectable={false}
                        elevateNodesOnSelect={false}
                        fitView
                        minZoom={0.01}
                        maxZoom={Infinity}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

/**
 * Fenêtre modale (95 % × 95 % de la zone de contenu principale, sous la barre de titre)
 * affichant une table et ses liaisons
 * directes (tables reliées par une clé étrangère entrante ou sortante), avec
 * les mêmes interactions que le viewer principal (déplacement des tables,
 * survol, zoom, recentrage).
 */
export function DependencyPopup(props: DependencyPopupProps) {
    return (
        <ReactFlowProvider>
            <DependencyPopupInner {...props} />
        </ReactFlowProvider>
    );
}
