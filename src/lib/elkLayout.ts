import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "reactflow";

/** Dimensions (px) de la zone d'affichage du diagramme. */
export interface ViewerDimensions {
    width: number;
    height: number;
}

/*
 * Dimensions estimées du rendu de `TableNode` : en-tête `text-sm py-2`
 * (20px de ligne + 16px de padding), lignes `text-xs py-1.5` (16px de ligne
 * + 12px de padding + 1px de séparateur), bordure de 1px de chaque côté.
 */
const ROW_HEIGHT = 29;
const HEADER_HEIGHT = 36;
const BORDER = 2;
/** Largeur minimale d'une table (`min-w-[240px]`). */
const MIN_NODE_WIDTH = 240;
/** Largeur maximale imposée pour éviter les tables démesurées. */
const MAX_NODE_WIDTH = 480;
/** Largeur moyenne d'un caractère (px) pour `text-xs` et `text-sm font-bold`. */
const CHAR_WIDTH_XS = 6.4;
const CHAR_WIDTH_SM_BOLD = 8.4;
/** Padding horizontal d'une ligne (px-3) + espace entre nom et type (gap-2). */
const ROW_HORIZONTAL_PADDING = 24 + 8;
/** Icône de clé (w-3) + son écart (gap-1.5). */
const KEY_ICON_WIDTH = 12 + 6;
const PADDING = 30;
/**
 * Espacement de base entre tables (px), légèrement augmenté avec la taille du
 * graphe. Volontairement compact : plus l'emprise du diagramme est petite,
 * plus le zoom appliqué par `fitView` est élevé et plus les tables sont
 * grandes à l'écran.
 */
const BASE_NODE_SPACING = 24;
const BASE_LAYER_SPACING = 36;
/** Directions de layout candidates ; la meilleure pour l'écran est retenue. */
const LAYOUT_DIRECTIONS = ["DOWN", "RIGHT"] as const;
/**
 * Stratégies de placement candidates : Brandes-Köpf produit des alignements
 * réguliers, Network Simplex des couches nettement plus compactes.
 */
const PLACEMENT_STRATEGIES = ["BRANDES_KOEPF", "NETWORK_SIMPLEX"] as const;
/** Facteur d'étirement maximal appliqué pour remplir l'écran. */
const MAX_STRETCH = 2.5;

/** Côtés d'une table sur lesquels une liaison peut être accrochée. */
export type HandleSide = "top" | "bottom" | "left" | "right";

export const SOURCE_HANDLE_PREFIX = "source-";
export const TARGET_HANDLE_PREFIX = "target-";

const elk = new ELK();

interface NodeColumn {
    name?: string;
    type?: string;
    category?: string;
    foreignKey?: boolean;
}

function nodeColumns(node: Node): NodeColumn[] {
    return (node.data?.columns ?? []) as NodeColumn[];
}

/** Hauteur estimée (px) d'une table telle que rendue par `TableNode`. */
export function nodeHeight(node: Node): number {
    if (node.height) {
        return node.height;
    }
    return HEADER_HEIGHT + nodeColumns(node).length * ROW_HEIGHT + BORDER;
}

/**
 * Largeur estimée (px) d'une table d'après son contenu : le nom de la table
 * dans l'en-tête et, pour chaque ligne, le nom de la colonne (avec son icône
 * de clé éventuelle) et son type.
 */
export function nodeWidth(node: Node): number {
    if (node.width) {
        return node.width;
    }
    const styleWidth = node.style?.width;
    if (typeof styleWidth === "number") {
        return styleWidth;
    }
    const tableName = String(node.data?.table ?? "");
    let width = tableName.length * CHAR_WIDTH_SM_BOLD + 24;
    for (const column of nodeColumns(node)) {
        const nameLength = (column.name ?? "").length;
        const typeLength = (column.type ?? "").length;
        const hasIcon =
            column.category === "id" ||
            column.category === "external" ||
            column.category === "index" ||
            column.foreignKey === true;
        const icon = hasIcon ? KEY_ICON_WIDTH : 0;
        const rowWidth = (nameLength + typeLength) * CHAR_WIDTH_XS + icon + ROW_HORIZONTAL_PADDING;
        width = Math.max(width, rowWidth);
    }
    return Math.ceil(Math.min(Math.max(width, MIN_NODE_WIDTH), MAX_NODE_WIDTH));
}

function nodeCenter(node: Node): { x: number; y: number } {
    return {
        x: node.position.x + nodeWidth(node) / 2,
        y: node.position.y + (node.height ?? nodeHeight(node)) / 2
    };
}

/**
 * Choisit le côté de la table `from` le plus proche de la table `to`, en
 * comparant le décalage horizontal et vertical (normalisé par la taille de
 * la table) entre les deux centres.
 */
function pickSide(from: Node, to: Node): HandleSide {
    const a = nodeCenter(from);
    const b = nodeCenter(to);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const halfWidth = nodeWidth(from) / 2;
    const halfHeight = (from.height ?? nodeHeight(from)) / 2;
    // Décalage relatif : > 1 signifie que l'autre table dépasse le bord.
    const relX = Math.abs(dx) / Math.max(halfWidth, 1);
    const relY = Math.abs(dy) / Math.max(halfHeight, 1);
    if (relX > relY) {
        return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "bottom" : "top";
}

/**
 * Attribue à chaque liaison les handles (source/target) les mieux placés sur
 * les tables en fonction de leurs positions courantes : une liaison part du
 * côté de la table source qui fait face à la cible, et inversement. Les
 * liaisons réflexives partent du bas pour revenir par le haut.
 */
export function assignEdgeHandles(nodes: Node[], edges: Edge[]): Edge[] {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return edges.map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) {
            return edge;
        }
        let sourceSide: HandleSide;
        let targetSide: HandleSide;
        if (source.id === target.id) {
            sourceSide = "bottom";
            targetSide = "top";
        } else {
            sourceSide = pickSide(source, target);
            targetSide = pickSide(target, source);
        }
        const sourceHandle = SOURCE_HANDLE_PREFIX + sourceSide;
        const targetHandle = TARGET_HANDLE_PREFIX + targetSide;
        if (edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) {
            return edge;
        }
        return { ...edge, sourceHandle, targetHandle };
    });
}

/**
 * Détermine le ratio largeur/hauteur cible transmis à ELK ("aspectRatio")
 * à partir des dimensions du viewer. Par défaut on privilégie un affichage
 * horizontal (16:10).
 */
function computeAspectRatio(viewerDimensions?: ViewerDimensions): number {
    if (!viewerDimensions || !viewerDimensions.width || !viewerDimensions.height) {
        return 1.6;
    }
    const aspect = viewerDimensions.width / viewerDimensions.height;
    if (!Number.isFinite(aspect) || aspect <= 0) {
        return 1.6;
    }
    return Math.min(Math.max(aspect, 0.5), 3.2);
}

interface Placement {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Étire les positions (pas les tailles) des tables pour que l'emprise du
 * diagramme adopte le ratio largeur/hauteur du viewer : ainsi, une fois le
 * zoom ajusté (`fitView`), le schéma occupe toute la surface de l'écran au
 * lieu de laisser de larges bandes vides. Un facteur d'étirement >= 1 ne fait
 * qu'agrandir les espaces entre tables, aucun chevauchement n'est introduit.
 */
function stretchToViewer(placements: Placement[], viewerDimensions?: ViewerDimensions): Placement[] {
    if (placements.length < 2 || !viewerDimensions?.width || !viewerDimensions?.height) {
        return placements;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of placements) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + p.width);
        maxY = Math.max(maxY, p.y + p.height);
    }
    const layoutWidth = maxX - minX;
    const layoutHeight = maxY - minY;
    if (layoutWidth <= 0 || layoutHeight <= 0) {
        return placements;
    }
    const targetAspect = viewerDimensions.width / viewerDimensions.height;
    const currentAspect = layoutWidth / layoutHeight;
    if (!Number.isFinite(targetAspect) || !Number.isFinite(currentAspect)) {
        return placements;
    }

    // Largeur (ou hauteur) cible de l'emprise pour atteindre le ratio voulu.
    let scaleX = 1;
    let scaleY = 1;
    if (currentAspect < targetAspect) {
        const targetWidth = layoutHeight * targetAspect;
        const maxNodeWidth = Math.max(...placements.map((p) => p.width));
        // On répartit l'espace supplémentaire sur les positions uniquement.
        const spread = Math.max(layoutWidth - maxNodeWidth, 1);
        scaleX = Math.min((targetWidth - maxNodeWidth) / spread, MAX_STRETCH);
    } else if (currentAspect > targetAspect) {
        const targetHeight = layoutWidth / targetAspect;
        const maxNodeHeight = Math.max(...placements.map((p) => p.height));
        const spread = Math.max(layoutHeight - maxNodeHeight, 1);
        scaleY = Math.min((targetHeight - maxNodeHeight) / spread, MAX_STRETCH);
    }
    scaleX = Math.max(scaleX, 1);
    scaleY = Math.max(scaleY, 1);
    if (scaleX === 1 && scaleY === 1) {
        return placements;
    }

    return placements.map((p) => ({
        ...p,
        x: minX + (p.x - minX) * scaleX,
        y: minY + (p.y - minY) * scaleY
    }));
}

/**
 * Espacement entre tables : plus le cluster est grand, plus on aère afin que
 * les liaisons restent lisibles ; les petits clusters restent compacts.
 */
function computeSpacing(nodeCount: number): { nodeNode: number; layer: number } {
    const factor = Math.min(1 + nodeCount / 100, 1.2);
    return {
        nodeNode: Math.round(BASE_NODE_SPACING * factor),
        layer: Math.round(BASE_LAYER_SPACING * factor)
    };
}

/** Deux intervalles [a, a+la] et [b, b+lb] se recouvrent-ils (avec marge) ? */
function overlaps(a: number, la: number, b: number, lb: number, gap: number): boolean {
    return a < b + lb + gap && b < a + la + gap;
}

/**
 * Compaction gloutonne : chaque table est remontée (puis décalée à gauche)
 * autant que possible sans chevaucher les tables déjà placées qui la
 * précèdent sur l'autre axe. L'ordre relatif des tables est conservé sur
 * chaque axe, aucun chevauchement n'est donc introduit ; on supprime ainsi
 * les trous laissés par le repliement des couches d'ELK.
 */
function compactPlacements(placements: Placement[], gap: number): Placement[] {
    if (placements.length < 2) {
        return placements;
    }
    // L'index d'origine est conservé pour restituer l'ordre initial.
    let items = placements.map((p, index) => ({ ...p, index }));
    for (let pass = 0; pass < 2; pass++) {
        // Axe vertical.
        let placed: Placement[] = [];
        items = [...items]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((p) => {
                let y = 0;
                for (const q of placed) {
                    if (overlaps(p.x, p.width, q.x, q.width, gap)) {
                        y = Math.max(y, q.y + q.height + gap);
                    }
                }
                const moved = { ...p, y };
                placed.push(moved);
                return moved;
            });
        // Axe horizontal.
        placed = [];
        items = [...items]
            .sort((a, b) => a.x - b.x || a.y - b.y)
            .map((p) => {
                let x = 0;
                for (const q of placed) {
                    if (overlaps(p.y, p.height, q.y, q.height, gap)) {
                        x = Math.max(x, q.x + q.width + gap);
                    }
                }
                const moved = { ...p, x };
                placed.push(moved);
                return moved;
            });
    }
    const result: Placement[] = new Array(placements.length);
    for (const { index, ...p } of items) {
        result[index] = p;
    }
    return result;
}

/** Emprise (largeur/hauteur) d'un ensemble de placements. */
function boundingSize(placements: Placement[]): { width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of placements) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + p.width);
        maxY = Math.max(maxY, p.y + p.height);
    }
    return { width: Math.max(maxX - minX, 1), height: Math.max(maxY - minY, 1) };
}

/**
 * Zoom que `fitView` appliquera pour faire tenir l'emprise dans le viewer :
 * c'est le facteur d'agrandissement des tables à l'écran, que l'on cherche
 * à maximiser.
 */
function fitZoom(placements: Placement[], viewerDimensions?: ViewerDimensions): number {
    const size = boundingSize(placements);
    const viewer = viewerDimensions?.width && viewerDimensions?.height
        ? viewerDimensions
        : { width: 1600, height: 1000 };
    return Math.min(viewer.width / size.width, viewer.height / size.height);
}

/**
 * Exécute le layout ELK dans une direction donnée et renvoie les placements
 * des tables (dans l'ordre des `children` du graphe).
 */
async function runElk(
    nodes: Node[],
    elkEdges: ElkExtendedEdge[],
    sizes: Map<string, { width: number; height: number }>,
    direction: (typeof LAYOUT_DIRECTIONS)[number],
    placement: (typeof PLACEMENT_STRATEGIES)[number],
    aspectRatio: number
): Promise<Map<string, Placement>> {
    const spacing = computeSpacing(nodes.length);

    const graph: ElkNode = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": "layered",
            "elk.direction": direction,
            "elk.layered.spacing.nodeNodeBetweenLayers": String(spacing.layer),
            "elk.spacing.nodeNode": String(spacing.nodeNode),
            "elk.spacing.edgeNode": "12",
            "elk.spacing.edgeEdge": "8",
            "elk.layered.spacing.edgeNodeBetweenLayers": "12",
            "elk.layered.spacing.edgeEdgeBetweenLayers": "8",
            "elk.spacing.componentComponent": String(spacing.nodeNode),
            "elk.separateConnectedComponents": "true",
            // Les composants connexes sont emboîtés pour combler les vides.
            "elk.layered.compaction.connectedComponents": "true",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.layered.nodePlacement.strategy": placement,
            "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
            "elk.layered.nodePlacement.favorStraightEdges": "false",
            "elk.layered.cycleBreaking.strategy": "GREEDY",
            "elk.layered.compaction.postCompaction.strategy": "LEFT_RIGHT_CONSTRAINT",
            "elk.layered.compaction.postCompaction.constraints": "QUADRATIC",
            // Les longues chaînes de couches sont repliées pour respecter le
            // ratio de l'écran au lieu de s'étirer dans une seule dimension.
            "elk.layered.wrapping.strategy": "MULTI_EDGE",
            "elk.layered.wrapping.cutting.strategy": "ARD",
            "elk.layered.wrapping.additionalEdgeSpacing": String(spacing.nodeNode),
            "elk.layered.wrapping.correctionFactor": "1.0",
            "elk.aspectRatio": String(aspectRatio),
            "elk.edgeRouting": "ORTHOGONAL"
        },
        children: nodes.map((node) => ({
            id: node.id,
            ...sizes.get(node.id)!
        })),
        edges: elkEdges
    };

    const laidOut = await elk.layout(graph);
    const placements = new Map<string, Placement>();
    for (const child of laidOut.children ?? []) {
        const size = sizes.get(child.id) ?? { width: MIN_NODE_WIDTH, height: HEADER_HEIGHT };
        placements.set(child.id, { x: child.x ?? 0, y: child.y ?? 0, ...size });
    }
    return placements;
}

/**
 * Positionne les tables du diagramme à l'aide de la librairie elkjs
 * (algorithme "layered", inspiré de Sugiyama) : les tables sont réparties en
 * couches selon le sens des relations, ce qui produit un rendu hiérarchique
 * lisible avec un minimum de croisements de liens. La direction (verticale ou
 * horizontale) retenue est celle qui affiche les tables le plus grand possible
 * dans le viewer.
 */
export async function layoutGraph(
    nodes: Node[],
    edges: Edge[],
    viewerDimensions?: ViewerDimensions
): Promise<Node[]> {
    if (nodes.length === 0) {
        return nodes;
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const elkEdges: ElkExtendedEdge[] = edges
        .filter((e) => e.source !== e.target && nodeIds.has(e.source) && nodeIds.has(e.target))
        .map((e) => ({
            id: e.id,
            sources: [e.source],
            targets: [e.target]
        }));

    const sizes = new Map(nodes.map((node) => [node.id, { width: nodeWidth(node), height: nodeHeight(node) }]));
    const aspectRatio = computeAspectRatio(viewerDimensions);

    const spacing = computeSpacing(nodes.length);

    // Le layout est calculé pour chaque combinaison direction × stratégie de
    // placement, puis compacté ; on retient la variante dont l'emprise, une
    // fois ajustée à l'écran, laisse les tables les plus grandes (zoom de
    // `fitView` maximal).
    const candidates = await Promise.all(
        LAYOUT_DIRECTIONS.flatMap((direction) =>
            PLACEMENT_STRATEGIES.map((placement) => runElk(nodes, elkEdges, sizes, direction, placement, aspectRatio))
        )
    );
    let bestIds: string[] = [];
    let bestPlacements: Placement[] = [];
    let bestZoom = -Infinity;
    for (const candidate of candidates) {
        const ids = [...candidate.keys()];
        const compacted = compactPlacements(ids.map((id) => candidate.get(id)!), spacing.nodeNode);
        const zoom = fitZoom(compacted, viewerDimensions);
        if (zoom > bestZoom) {
            bestZoom = zoom;
            bestIds = ids;
            bestPlacements = compacted;
        }
    }

    const ids = bestIds;
    const stretched = stretchToViewer(bestPlacements, viewerDimensions);
    const positions = new Map<string, Placement>();
    ids.forEach((id, index) => {
        positions.set(id, stretched[index]);
    });

    return nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return node;
        return {
            ...node,
            position: { x: PADDING + pos.x, y: PADDING + pos.y },
            // Largeur imposée au rendu afin que les liaisons et le layout
            // reposent sur les mêmes dimensions que celles transmises à ELK.
            style: { ...node.style, width: pos.width }
        };
    });
}
