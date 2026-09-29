import type { Edge, Node } from "reactflow";
import { computeTargetAspect, type ViewerDimensions } from "./cytoscapeLayout";

/**
 * Layout en couches (style ELK « layered » / Sugiyama), implémenté sans
 * dépendance externe :
 *  1. séparation des composantes connexes ;
 *  2. suppression des cycles (inversion des arcs arrière) ;
 *  3. affectation des couches (plus long chemin) ;
 *  4. insertion de nœuds fictifs pour les relations traversant plusieurs couches ;
 *  5. réduction des croisements (heuristique des barycentres, balayages alternés) ;
 *  6. affectation des coordonnées (couches de haut en bas, tables alignées
 *     sur leurs voisines) ;
 *  7. empilement des composantes en respectant les proportions de l'écran ;
 *  8. étirement final : rangées équidistribuées sur la hauteur, tables
 *     équidistribuées sur la largeur, enveloppe aux proportions de l'écran.
 */

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 36;
const NODE_WIDTH = 120;
/** Espace vertical entre deux couches (les relations y circulent). */
const LAYER_SPACING = 20;
/** Espace horizontal entre deux tables d'une même couche. */
const NODE_SPACING = 10;
/** Espace entre deux composantes connexes. */
const COMPONENT_SPACING = 10;
const PADDING = 10;
/** Largeur d'un nœud fictif (point de passage d'une longue relation). */
const DUMMY_WIDTH = 12;
/** Nombre de balayages de réduction des croisements. */
const CROSSING_SWEEPS = 12;
/** Nombre de balayages d'alignement horizontal. */
const ALIGNMENT_SWEEPS = 6;
/** Écart horizontal maximal entre deux tables lors de l'étirement final. */
const MAX_ROW_GAP = 2 * NODE_WIDTH;

interface LNode {
    id: string;
    /** Extension le long de la couche (largeur de la table). */
    extent: number;
    /** Épaisseur perpendiculaire à la couche (hauteur de la table). */
    depth: number;
    dummy: boolean;
    layer: number;
    order: number;
    /** Position le long de la couche (abscisse). */
    pos: number;
    preds: LNode[];
    succs: LNode[];
}

interface Point {
    x: number;
    y: number;
}

interface Box {
    width: number;
    height: number;
}

/** Rangée globale du diagramme : tables (réelles) et hauteur de la plus haute. */
interface Row {
    ids: string[];
    depth: number;
}

interface ComponentLayout {
    positions: Map<string, Point>;
    size: Box;
    /** Identifiants des tables réelles de chaque couche, de haut en bas. */
    layers: string[][];
}

function nodeHeight(node: Node): number {
    const columnsCount = (node.data?.columns?.length ?? 0) as number;
    return HEADER_HEIGHT + columnsCount * ROW_HEIGHT + 12;
}

/** Arcs orientés distincts (réflexifs ignorés, extrémités inconnues ignorées). */
function directedEdges(nodes: Node[], edges: Edge[]): Array<[string, string]> {
    const ids = new Set(nodes.map((n) => n.id));
    const seen = new Set<string>();
    const result: Array<[string, string]> = [];
    for (const e of edges) {
        if (e.source === e.target) continue;
        if (!ids.has(e.source) || !ids.has(e.target)) continue;
        const key = `${e.source}->${e.target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push([e.source, e.target]);
    }
    return result;
}

/** Composantes connexes (au sens non orienté), les plus grandes d'abord. */
function connectedComponents(nodes: Node[], arcs: Array<[string, string]>): Node[][] {
    const neighbours = new Map<string, Set<string>>();
    for (const n of nodes) neighbours.set(n.id, new Set());
    for (const [a, b] of arcs) {
        neighbours.get(a)?.add(b);
        neighbours.get(b)?.add(a);
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const components: Node[][] = [];
    for (const n of nodes) {
        if (visited.has(n.id)) continue;
        const component: Node[] = [];
        const stack = [n.id];
        visited.add(n.id);
        while (stack.length > 0) {
            const id = stack.pop() as string;
            component.push(byId.get(id) as Node);
            for (const other of neighbours.get(id) ?? []) {
                if (!visited.has(other)) {
                    visited.add(other);
                    stack.push(other);
                }
            }
        }
        components.push(component);
    }
    components.sort((a, b) => b.length - a.length);
    return components;
}

/**
 * Rend le graphe acyclique en inversant les arcs arrière rencontrés lors d'un
 * parcours en profondeur (les tables les plus référencées servent de racines).
 */
function removeCycles(ids: string[], arcs: Array<[string, string]>): Array<[string, string]> {
    const out = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    for (const id of ids) {
        out.set(id, []);
        inDegree.set(id, 0);
    }
    for (const [a, b] of arcs) {
        out.get(a)?.push(b);
        inDegree.set(b, (inDegree.get(b) ?? 0) + 1);
    }
    const state = new Map<string, number>(); // 0 = non visité, 1 = en cours, 2 = terminé
    const reversed = new Set<string>();
    const visit = (id: string) => {
        state.set(id, 1);
        for (const next of out.get(id) ?? []) {
            const s = state.get(next) ?? 0;
            if (s === 1) {
                reversed.add(`${id}->${next}`);
            } else if (s === 0) {
                visit(next);
            }
        }
        state.set(id, 2);
    };
    const roots = [...ids].sort((a, b) => (inDegree.get(a) ?? 0) - (inDegree.get(b) ?? 0));
    for (const id of roots) {
        if ((state.get(id) ?? 0) === 0) visit(id);
    }
    return arcs.map(([a, b]): [string, string] => (reversed.has(`${a}->${b}`) ? [b, a] : [a, b]));
}

/**
 * Affecte une couche à chaque table : plus long chemin depuis les sources,
 * puis les sources sont rapprochées de leur première cible pour raccourcir
 * les relations.
 */
function assignLayers(ids: string[], arcs: Array<[string, string]>): Map<string, number> {
    const preds = new Map<string, string[]>();
    const succs = new Map<string, string[]>();
    for (const id of ids) {
        preds.set(id, []);
        succs.set(id, []);
    }
    for (const [a, b] of arcs) {
        succs.get(a)?.push(b);
        preds.get(b)?.push(a);
    }
    const layer = new Map<string, number>();
    const remaining = new Map<string, number>(ids.map((id) => [id, preds.get(id)?.length ?? 0]));
    const queue = ids.filter((id) => (remaining.get(id) ?? 0) === 0);
    for (const id of queue) layer.set(id, 0);
    while (queue.length > 0) {
        const id = queue.shift() as string;
        const l = layer.get(id) ?? 0;
        for (const next of succs.get(id) ?? []) {
            layer.set(next, Math.max(layer.get(next) ?? 0, l + 1));
            const r = (remaining.get(next) ?? 0) - 1;
            remaining.set(next, r);
            if (r === 0) queue.push(next);
        }
    }
    for (const id of ids) {
        if ((preds.get(id)?.length ?? 0) > 0) continue;
        const targets = succs.get(id) ?? [];
        if (targets.length === 0) continue;
        const minSucc = Math.min(...targets.map((t) => layer.get(t) ?? 0));
        layer.set(id, Math.max(0, minSucc - 1));
    }
    return layer;
}

/**
 * Respecte les proportions de l'écran : une couche trop large (beaucoup de
 * tables côte à côte) est scindée en plusieurs couches adjacentes, de sorte
 * que la largeur du diagramme reste proche de celle attendue pour l'aspect
 * cible. Les couches suivantes sont décalées d'autant.
 */
function splitWideLayers(nodes: Node[], layer: Map<string, number>, targetAspect: number): void {
    let totalHeight = 0;
    for (const n of nodes) totalHeight += nodeHeight(n) + LAYER_SPACING;
    const estimatedArea = totalHeight * (NODE_WIDTH + NODE_SPACING);
    const maxLayerWidth = Math.max(NODE_WIDTH + NODE_SPACING, Math.sqrt(estimatedArea * targetAspect));
    const perLayer = Math.max(1, Math.floor(maxLayerWidth / (NODE_WIDTH + NODE_SPACING)));

    const layerCount = Math.max(0, ...Array.from(layer.values())) + 1;
    const groups: string[][] = Array.from({ length: layerCount }, () => []);
    for (const n of nodes) groups[layer.get(n.id) ?? 0].push(n.id);

    let next = 0;
    for (const group of groups) {
        if (group.length === 0) continue;
        const parts = Math.ceil(group.length / perLayer);
        const perPart = Math.ceil(group.length / parts);
        group.forEach((id, i) => layer.set(id, next + Math.floor(i / perPart)));
        next += Math.ceil(group.length / perPart);
    }
}

/** Nombre de croisements entre deux couches adjacentes. */
function crossingsBetween(upper: LNode[]): number {
    const pairs: Array<[number, number]> = [];
    for (const u of upper) {
        for (const v of u.succs) pairs.push([u.order, v.order]);
    }
    pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let crossings = 0;
    for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
            if (pairs[i][0] < pairs[j][0] && pairs[i][1] > pairs[j][1]) crossings++;
        }
    }
    return crossings;
}

function totalCrossings(layers: LNode[][]): number {
    let total = 0;
    for (let l = 0; l < layers.length - 1; l++) total += crossingsBetween(layers[l]);
    return total;
}

function reorder(layer: LNode[]): void {
    layer.forEach((n, i) => {
        n.order = i;
    });
}

/**
 * Réduction des croisements : on trie alternativement chaque couche selon le
 * barycentre des positions de ses voisines (précédentes puis suivantes) et on
 * conserve la meilleure configuration rencontrée.
 */
function reduceCrossings(layers: LNode[][]): void {
    let best = totalCrossings(layers);
    let bestOrders = layers.map((layer) => layer.map((n) => n.id));
    const byId = new Map<string, LNode>();
    for (const layer of layers) for (const n of layer) byId.set(n.id, n);

    for (let sweep = 0; sweep < CROSSING_SWEEPS; sweep++) {
        const forward = sweep % 2 === 0;
        const indices = forward
            ? layers.map((_, i) => i).slice(1)
            : layers.map((_, i) => i).slice(0, -1).reverse();
        for (const l of indices) {
            const layer = layers[l];
            const bary = new Map<string, number>();
            for (const n of layer) {
                const refs = forward ? n.preds : n.succs;
                if (refs.length === 0) {
                    bary.set(n.id, n.order);
                } else {
                    let sum = 0;
                    for (const r of refs) sum += r.order;
                    bary.set(n.id, sum / refs.length);
                }
            }
            layer.sort((a, b) => (bary.get(a.id) ?? 0) - (bary.get(b.id) ?? 0) || a.order - b.order);
            reorder(layer);
        }
        const crossings = totalCrossings(layers);
        if (crossings < best) {
            best = crossings;
            bestOrders = layers.map((layer) => layer.map((n) => n.id));
            if (best === 0) break;
        }
    }
    for (let l = 0; l < layers.length; l++) {
        layers[l] = bestOrders[l].map((id) => byId.get(id) as LNode);
        reorder(layers[l]);
    }
}

/** Aligne les tables d'une couche côte à côte, dans l'ordre, sans chevauchement. */
function stackLayer(layer: LNode[]): void {
    let pos = 0;
    for (const n of layer) {
        n.pos = pos;
        pos += n.extent + NODE_SPACING;
    }
}

/**
 * Rapproche chaque table de ses voisines (couche précédente ou suivante) en
 * conservant l'ordre et l'espacement minimal, puis recentre la couche sur les
 * positions souhaitées.
 */
function alignLayer(layer: LNode[], forward: boolean): void {
    const desired = new Map<string, number>();
    for (const n of layer) {
        const refs = forward ? n.preds : n.succs;
        if (refs.length === 0) {
            desired.set(n.id, n.pos);
            continue;
        }
        let sum = 0;
        for (const r of refs) sum += r.pos + r.extent / 2;
        desired.set(n.id, sum / refs.length - n.extent / 2);
    }
    let prevEnd = -Infinity;
    for (const n of layer) {
        const wanted = desired.get(n.id) ?? n.pos;
        n.pos = prevEnd === -Infinity ? wanted : Math.max(wanted, prevEnd + NODE_SPACING);
        prevEnd = n.pos + n.extent;
    }
    let drift = 0;
    for (const n of layer) drift += (desired.get(n.id) ?? n.pos) - n.pos;
    drift /= Math.max(layer.length, 1);
    for (const n of layer) n.pos += drift;
}

function assignCoordinates(layers: LNode[][]): void {
    for (const layer of layers) stackLayer(layer);
    // Centrage horizontal initial de chaque couche.
    let maxWidth = 0;
    for (const layer of layers) {
        const last = layer[layer.length - 1];
        maxWidth = Math.max(maxWidth, last.pos + last.extent);
    }
    for (const layer of layers) {
        const last = layer[layer.length - 1];
        const offset = (maxWidth - (last.pos + last.extent)) / 2;
        for (const n of layer) n.pos += offset;
    }
    for (let sweep = 0; sweep < ALIGNMENT_SWEEPS; sweep++) {
        if (sweep % 2 === 0) {
            for (let l = 1; l < layers.length; l++) alignLayer(layers[l], true);
        } else {
            for (let l = layers.length - 2; l >= 0; l--) alignLayer(layers[l], false);
        }
    }
}

/** Positionne une composante connexe ; retourne ses positions (origine en 0,0) et sa taille. */
function layoutComponent(nodes: Node[], arcs: Array<[string, string]>, targetAspect: number): ComponentLayout {
    const ids = nodes.map((n) => n.id);
    const acyclic = removeCycles(ids, arcs);
    const layerOf = assignLayers(ids, acyclic);
    splitWideLayers(nodes, layerOf, targetAspect);

    const lnodes = new Map<string, LNode>();
    for (const n of nodes) {
        lnodes.set(n.id, {
            id: n.id,
            extent: NODE_WIDTH,
            depth: nodeHeight(n),
            dummy: false,
            layer: layerOf.get(n.id) ?? 0,
            order: 0,
            pos: 0,
            preds: [],
            succs: []
        });
    }
    let dummyCount = 0;
    const link = (a: LNode, b: LNode) => {
        a.succs.push(b);
        b.preds.push(a);
    };
    for (const [from, to] of acyclic) {
        let prev = lnodes.get(from) as LNode;
        const target = lnodes.get(to) as LNode;
        for (let l = prev.layer + 1; l < target.layer; l++) {
            const dummy: LNode = {
                id: `__dummy_${dummyCount++}`,
                extent: DUMMY_WIDTH,
                depth: 0,
                dummy: true,
                layer: l,
                order: 0,
                pos: 0,
                preds: [],
                succs: []
            };
            lnodes.set(dummy.id, dummy);
            link(prev, dummy);
            prev = dummy;
        }
        link(prev, target);
    }

    const layerCount = Math.max(0, ...Array.from(lnodes.values()).map((n) => n.layer)) + 1;
    let layers: LNode[][] = Array.from({ length: layerCount }, () => []);
    for (const n of lnodes.values()) layers[n.layer].push(n);
    layers = layers.filter((layer) => layer.length > 0);
    layers.forEach((layer, l) => {
        for (const n of layer) n.layer = l;
        // Ordre initial stable : tables réelles d'abord, dans l'ordre du modèle.
        layer.sort((a, b) => Number(a.dummy) - Number(b.dummy));
        reorder(layer);
    });

    reduceCrossings(layers);
    assignCoordinates(layers);

    let minX = Infinity;
    let maxX = -Infinity;
    for (const layer of layers) {
        for (const n of layer) {
            minX = Math.min(minX, n.pos);
            maxX = Math.max(maxX, n.pos + n.extent);
        }
    }
    // Les couches se succèdent de haut en bas ; l'épaisseur d'une couche est
    // la hauteur de sa table la plus haute.
    const positions = new Map<string, Point>();
    let y = 0;
    for (let l = 0; l < layers.length; l++) {
        let depth = 0;
        for (const n of layers[l]) {
            depth = Math.max(depth, n.depth);
            if (n.dummy) continue;
            positions.set(n.id, { x: n.pos - minX, y });
        }
        y += depth + (l < layers.length - 1 ? LAYER_SPACING : 0);
    }
    return {
        positions,
        size: { width: maxX - minX, height: y },
        layers: layers.map((layer) => layer.filter((n) => !n.dummy).map((n) => n.id))
    };
}

/**
 * Étirement final : l'enveloppe du diagramme adopte les proportions de
 * l'écran (la dimension déficitaire est agrandie), les rangées sont réparties
 * uniformément sur la hauteur et, dans chaque rangée, les tables sont
 * équidistribuées sur la largeur (écart borné par `MAX_ROW_GAP`, la rangée
 * restant centrée sur sa position horizontale d'origine). L'ordre des tables
 * dans une rangée est conservé.
 */
function stretchToScreen(rows: Row[], positions: Map<string, Point>, targetAspect: number): void {
    if (rows.length === 0 || positions.size === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of positions.values()) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + NODE_WIDTH);
    }
    const currentWidth = Math.max(maxX - minX, NODE_WIDTH);

    let depthSum = 0;
    let widest = 0;
    for (const row of rows) {
        depthSum += row.depth;
        widest = Math.max(widest, row.ids.length);
    }
    const minHeight = depthSum + (rows.length - 1) * LAYER_SPACING;
    const minWidth = widest * NODE_WIDTH + Math.max(0, widest - 1) * NODE_SPACING;

    let width = Math.max(currentWidth, minWidth);
    let height = Math.max(minHeight, 1);
    if (width / height < targetAspect) {
        width = height * targetAspect;
    } else {
        height = width / targetAspect;
    }

    const gapY = rows.length > 1 ? (height - depthSum) / (rows.length - 1) : 0;
    let y = 0;
    for (const row of rows) {
        const n = row.ids.length;
        if (n === 0) {
            y += row.depth + gapY;
            continue;
        }
        const sorted = [...row.ids].sort(
            (a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0)
        );
        const gap = n > 1 ? Math.min(MAX_ROW_GAP, (width - n * NODE_WIDTH) / (n - 1)) : 0;
        const rowWidth = n * NODE_WIDTH + (n - 1) * gap;

        // Centre actuel de la rangée, rapporté à la nouvelle largeur.
        let centroid = 0;
        for (const id of sorted) centroid += (positions.get(id)?.x ?? 0) - minX + NODE_WIDTH / 2;
        centroid /= n;
        const scaledCenter =
            currentWidth > NODE_WIDTH
                ? ((centroid - NODE_WIDTH / 2) / (currentWidth - NODE_WIDTH)) * (width - NODE_WIDTH) + NODE_WIDTH / 2
                : width / 2;
        const start = Math.min(Math.max(scaledCenter - rowWidth / 2, 0), Math.max(0, width - rowWidth));

        sorted.forEach((id, i) => positions.set(id, { x: start + i * (NODE_WIDTH + gap), y }));
        y += row.depth + gapY;
    }
}

/**
 * Positionne les tables en couches de haut en bas (les relations partent du
 * bord inférieur d'une table vers le bord supérieur de la suivante), à la
 * manière de l'algorithme « layered » d'ELK. Les composantes connexes sont
 * disposées en rangées, puis le diagramme est étiré aux proportions de
 * l'écran avec des espacements uniformes.
 */
export function layoutGraph(
    nodes: Node[],
    edges: Edge[],
    viewerDimensions?: ViewerDimensions
): Node[] {
    if (nodes.length === 0) {
        return nodes;
    }
    const targetAspect = computeTargetAspect(viewerDimensions);
    const arcs = directedEdges(nodes, edges);
    const components = connectedComponents(nodes, arcs);
    const laidOut = components.map((component) => {
        const ids = new Set(component.map((n) => n.id));
        const own = arcs.filter(([a, b]) => ids.has(a) && ids.has(b));
        return layoutComponent(component, own, targetAspect);
    });

    // Disposition des composantes en rangées (shelf packing) : la largeur
    // maximale d'une rangée est déduite de la surface totale et de l'aspect cible.
    let totalArea = 0;
    let widest = 0;
    for (const c of laidOut) {
        totalArea += (c.size.width + COMPONENT_SPACING) * (c.size.height + COMPONENT_SPACING);
        widest = Math.max(widest, c.size.width);
    }
    const maxRowWidth = Math.max(widest, Math.sqrt(totalArea * targetAspect));

    const heights = new Map(nodes.map((n) => [n.id, nodeHeight(n)]));
    const positions = new Map<string, Point>();
    // Rangées globales : les couches des composantes d'une même rangée de
    // rayonnage sont fusionnées index par index.
    const rows: Row[] = [];
    let rowX = 0;
    let rowY = 0;
    let rowHeight = 0;
    let rowBase = 0;
    let rowCount = 0;
    for (const c of laidOut) {
        if (rowX > 0 && rowX + c.size.width > maxRowWidth) {
            rowX = 0;
            rowY += rowHeight + COMPONENT_SPACING;
            rowHeight = 0;
            rowBase += rowCount;
            rowCount = 0;
        }
        for (const [id, p] of c.positions) {
            positions.set(id, { x: rowX + p.x, y: rowY + p.y });
        }
        c.layers.forEach((ids, l) => {
            const index = rowBase + l;
            while (rows.length <= index) rows.push({ ids: [], depth: 0 });
            const row = rows[index];
            row.ids.push(...ids);
            for (const id of ids) row.depth = Math.max(row.depth, heights.get(id) ?? 0);
        });
        rowCount = Math.max(rowCount, c.layers.length);
        rowX += c.size.width + COMPONENT_SPACING;
        rowHeight = Math.max(rowHeight, c.size.height);
    }

    stretchToScreen(rows, positions, targetAspect);

    return nodes.map((node) => {
        const p = positions.get(node.id);
        if (!p) return node;
        return { ...node, position: { x: PADDING + p.x, y: PADDING + p.y } };
    });
}
