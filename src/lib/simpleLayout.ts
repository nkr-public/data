import type { Edge, Node } from "reactflow";
import type { ViewerDimensions } from "./cytoscapeLayout";

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 36;
const NODE_WIDTH = 260;
const LAYER_GAP = 80;
const NODE_GAP = 40;

/**
 * Détermine la direction du layout (horizontal ou vertical) en fonction des
 * dimensions du viewer, afin d'utiliser au mieux la surface disponible.
 */
function pickDirection(viewerDimensions?: ViewerDimensions): "horizontal" | "vertical" {
    if (!viewerDimensions || !viewerDimensions.width || !viewerDimensions.height) {
        return "vertical";
    }
    return viewerDimensions.width >= viewerDimensions.height ? "vertical" : "horizontal";
}

function nodeHeight(node: Node): number {
    const columnsCount = (node.data?.columns?.length ?? 0) as number;
    return HEADER_HEIGHT + columnsCount * ROW_HEIGHT + 12;
}

/**
 * Calcule les "couches" (layers) des noeuds à partir des relations, en
 * s'appuyant sur un simple parcours en largeur (BFS) sur le graphe.
 */
function computeLayers(nodes: Node[], edges: Edge[]): Map<string, number> {
    const layers = new Map<string, number>();
    const outgoing = new Map<string, string[]>();
    const hasIncoming = new Set<string>();

    for (const node of nodes) {
        outgoing.set(node.id, []);
    }
    for (const edge of edges) {
        if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
        outgoing.get(edge.source)!.push(edge.target);
        hasIncoming.add(edge.target);
    }

    const roots = nodes.filter((node) => !hasIncoming.has(node.id));
    const queue: string[] = (roots.length > 0 ? roots : nodes).map((node) => node.id);
    for (const id of queue) {
        layers.set(id, 0);
    }

    // Garde-fou contre les cycles : sans cette limite, un cycle dans les
    // relations ferait grandir indéfiniment les couches (candidateLayer
    // toujours strictement supérieur) et bloquerait l'application dans une
    // boucle infinie.
    const maxVisitsPerNode = nodes.length + 1;
    const visitCounts = new Map<string, number>();

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentLayer = layers.get(current) ?? 0;
        for (const target of outgoing.get(current) ?? []) {
            const candidateLayer = currentLayer + 1;
            if (layers.get(target) === undefined || candidateLayer > layers.get(target)!) {
                const visits = (visitCounts.get(target) ?? 0) + 1;
                if (visits > maxVisitsPerNode) {
                    // Cycle détecté : on conserve la couche actuelle et on
                    // arrête de propager pour ce noeud afin d'éviter une
                    // boucle infinie.
                    continue;
                }
                visitCounts.set(target, visits);
                layers.set(target, candidateLayer);
                queue.push(target);
            }
        }
    }

    for (const node of nodes) {
        if (!layers.has(node.id)) {
            layers.set(node.id, 0);
        }
    }

    return layers;
}

/**
 * Positionne les noeuds du graphe sans dépendre d'une librairie de layout
 * externe (remplace l'ancienne implémentation basée sur elkjs).
 */
export function layoutGraph(
    nodes: Node[],
    edges: Edge[],
    viewerDimensions?: ViewerDimensions
): Node[] {
    const direction = pickDirection(viewerDimensions);
    const layers = computeLayers(nodes, edges);

    const nodesByLayer = new Map<number, Node[]>();
    for (const node of nodes) {
        const layer = layers.get(node.id) ?? 0;
        if (!nodesByLayer.get(layer)) {
            nodesByLayer.set(layer, []);
        }
        nodesByLayer.get(layer)!.push(node);
    }

    const positioned = new Map<string, { x: number; y: number }>();

    if (direction === "vertical") {
        let x = 0;
        for (const layer of Array.from(nodesByLayer.keys()).sort((a, b) => a - b)) {
            const layerNodes = nodesByLayer.get(layer)!;
            let y = 0;
            for (const node of layerNodes) {
                positioned.set(node.id, { x, y });
                y += nodeHeight(node) + NODE_GAP;
            }
            x += NODE_WIDTH + LAYER_GAP;
        }
    } else {
        let y = 0;
        for (const layer of Array.from(nodesByLayer.keys()).sort((a, b) => a - b)) {
            const layerNodes = nodesByLayer.get(layer)!;
            let x = 0;
            let maxHeight = 0;
            for (const node of layerNodes) {
                positioned.set(node.id, { x, y });
                x += NODE_WIDTH + NODE_GAP;
                maxHeight = Math.max(maxHeight, nodeHeight(node));
            }
            y += maxHeight + LAYER_GAP;
        }
    }

    return nodes.map((node) => ({
        ...node,
        position: positioned.get(node.id) ?? node.position
    }));
}
