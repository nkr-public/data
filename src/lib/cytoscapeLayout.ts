import type { Edge, Node } from "reactflow";

/** Dimensions (px) de la zone d'affichage du diagramme. */
export interface ViewerDimensions {
    width: number;
    height: number;
}

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 36;
const NODE_WIDTH = 260;
/** Espace horizontal minimal entre deux tables (laisse passer les liens). */
const GAP_X = 90;
/** Espace vertical minimal entre deux tables. */
const GAP_Y = 70;
const PADDING = 40;
/** Aspect (largeur / hauteur) privilégié : affichage horizontal type 16:10. */
const PREFERRED_ASPECT = 1.6;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3.2;

/** Poids de l'attraction d'une table vers ses voisines déjà placées. */
const W_ATTRACTION = 1.0;
/** Poids de la croissance relative de la surface englobante (compacité). */
const W_AREA = 3;
/** Poids de l'écart entre l'aspect du diagramme et celui de l'écran. */
const W_ASPECT = 3;
/** Pénalité par unité de dépassement de l'enveloppe idéale (aux proportions de l'écran). */
const W_ENVELOPE = 5;
/** Taux de remplissage attendu de l'enveloppe (tables / surface totale). */
const EXPECTED_FILL = 0.65;
/** Poids de la préférence des tables pivots pour le haut du diagramme. */
const W_TOP = 3;
/** Pénalité pour une table peu connectée placée au-dessus des pivots. */
const W_ABOVE = 20;
/** Pénalité pour une feuille (une seule relation) placée à l'intérieur du diagramme. */
const W_LEAF_INSIDE = 0.8;
/** Pénalité par relation (de la table à placer) qui traverserait une table déjà posée. */
const W_EDGE_THROUGH_TABLE = 6;
/** Pénalité par relation existante que la table à placer viendrait recouvrir. */
const W_TABLE_ON_EDGE = 6;
/** Marge (px) autour d'une table à l'intérieur de laquelle une relation est considérée comme la traversant. */
const EDGE_CLEARANCE = 12;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Box {
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

function nodeHeight(node: Node): number {
    const columnsCount = (node.data?.columns?.length ?? 0) as number;
    return HEADER_HEIGHT + columnsCount * ROW_HEIGHT + 12;
}

/**
 * Calcule l'aspect cible (largeur / hauteur) du diagramme à partir des
 * dimensions de l'écran. Sans dimensions exploitables on privilégie un
 * affichage horizontal (1.6). L'aspect est borné pour éviter des layouts
 * dégénérés sur des écrans très étirés.
 */
export function computeTargetAspect(viewerDimensions?: ViewerDimensions): number {
    if (!viewerDimensions || !viewerDimensions.width || !viewerDimensions.height) {
        return PREFERRED_ASPECT;
    }
    const aspect = viewerDimensions.width / viewerDimensions.height;
    if (!Number.isFinite(aspect) || aspect <= 0) {
        return PREFERRED_ASPECT;
    }
    return Math.min(Math.max(aspect, MIN_ASPECT), MAX_ASPECT);
}

/**
 * Mesure l'écart (symétrique, en échelle logarithmique) entre l'aspect d'une
 * boîte et l'aspect cible : 0 = parfait, plus la valeur est grande plus la
 * forme est éloignée de celle de l'écran.
 */
function aspectError(box: Box, targetAspect: number): number {
    const aspect = Math.max(box.width, 1) / Math.max(box.height, 1);
    return Math.abs(Math.log(aspect / targetAspect));
}

function boundsOf(rects: Iterable<Rect>): Rect {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const r of rects) {
        minX = Math.min(minX, r.x);
        minY = Math.min(minY, r.y);
        maxX = Math.max(maxX, r.x + r.width);
        maxY = Math.max(maxY, r.y + r.height);
    }
    if (!Number.isFinite(minX)) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function extendBounds(bounds: Rect, rect: Rect): Rect {
    if (bounds.width === 0 && bounds.height === 0) {
        return { ...rect };
    }
    const minX = Math.min(bounds.x, rect.x);
    const minY = Math.min(bounds.y, rect.y);
    const maxX = Math.max(bounds.x + bounds.width, rect.x + rect.width);
    const maxY = Math.max(bounds.y + bounds.height, rect.y + rect.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Deux rectangles se chevauchent-ils, en tenant compte des marges minimales ? */
function collides(a: Rect, b: Rect): boolean {
    return (
        a.x < b.x + b.width + GAP_X &&
        b.x < a.x + a.width + GAP_X &&
        a.y < b.y + b.height + GAP_Y &&
        b.y < a.y + a.height + GAP_Y
    );
}

function center(rect: Rect): Point {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Le segment [p, q] traverse-t-il le rectangle (élargi d'une marge) ?
 * Algorithme de Liang–Barsky : on réduit l'intervalle paramétrique [0, 1] par
 * les quatre demi-plans du rectangle ; s'il reste non vide, il y a intersection.
 */
function segmentIntersectsRect(p: Point, q: Point, rect: Rect, margin: number): boolean {
    const minX = rect.x - margin;
    const minY = rect.y - margin;
    const maxX = rect.x + rect.width + margin;
    const maxY = rect.y + rect.height + margin;
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    let t0 = 0;
    let t1 = 1;
    const clip = (denom: number, num: number): boolean => {
        if (denom === 0) {
            return num >= 0;
        }
        const t = num / denom;
        if (denom < 0) {
            if (t > t1) return false;
            if (t > t0) t0 = t;
        } else {
            if (t < t0) return false;
            if (t < t1) t1 = t;
        }
        return true;
    };
    return (
        clip(-dx, p.x - minX) &&
        clip(dx, maxX - p.x) &&
        clip(-dy, p.y - minY) &&
        clip(dy, maxY - p.y)
    );
}

/** Une relation entre deux tables déjà posées (pour détecter les recouvrements). */
interface PlacedEdge {
    sourceId: string;
    targetId: string;
    from: Point;
    to: Point;
}

/**
 * Construit la liste des voisins distincts de chaque table (liens réflexifs
 * ignorés) ; le degré d'une table est la taille de cette liste.
 */
function buildAdjacency(nodes: Node[], edges: Edge[]): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
        adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
        if (edge.source === edge.target) continue;
        const a = adjacency.get(edge.source);
        const b = adjacency.get(edge.target);
        if (!a || !b) continue;
        a.add(edge.target);
        b.add(edge.source);
    }
    return adjacency;
}

/**
 * Détermine l'ordre de placement des tables :
 *  1. les tables « pivots » et intermédiaires (au moins deux relations), en
 *     privilégiant à chaque étape la table la plus connectée parmi celles qui
 *     ont déjà une voisine placée (on grandit ainsi autour des pivots) ;
 *  2. les tables à relation unique (feuilles), regroupées par voisine ;
 *  3. les tables isolées, qui viendront combler les espaces restants.
 */
function placementOrder(nodes: Node[], adjacency: Map<string, Set<string>>): Node[] {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const degree = (id: string) => adjacency.get(id)?.size ?? 0;

    const core = nodes.filter((n) => degree(n.id) >= 2);
    const leaves = nodes.filter((n) => degree(n.id) === 1);
    const isolated = nodes.filter((n) => degree(n.id) === 0);

    const order: Node[] = [];
    const placed = new Set<string>();
    const remaining = new Set(core.map((n) => n.id));
    while (remaining.size > 0) {
        let bestId: string | null = null;
        let bestKey = -Infinity;
        for (const id of remaining) {
            let placedNeighbours = 0;
            for (const other of adjacency.get(id) ?? []) {
                if (placed.has(other)) placedNeighbours++;
            }
            // Une table reliée à des tables déjà placées passe toujours avant
            // une table d'un autre groupe ; à égalité, la plus connectée gagne.
            const key = (placedNeighbours > 0 ? 100000 : 0) + placedNeighbours * 1000 + degree(id);
            if (key > bestKey) {
                bestKey = key;
                bestId = id;
            }
        }
        const node = byId.get(bestId as string) as Node;
        order.push(node);
        placed.add(node.id);
        remaining.delete(node.id);
    }

    const rank = new Map(order.map((n, i) => [n.id, i]));
    leaves.sort((a, b) => {
        const na = Array.from(adjacency.get(a.id) ?? [])[0];
        const nb = Array.from(adjacency.get(b.id) ?? [])[0];
        return (rank.get(na) ?? Infinity) - (rank.get(nb) ?? Infinity);
    });
    // Les couples de tables reliées uniquement entre elles (deux feuilles) :
    // la première sera posée sans voisine placée, la seconde viendra à côté.
    order.push(...leaves);
    // Les isolées : les plus grandes d'abord pour combler les gros trous.
    isolated.sort((a, b) => nodeHeight(b) - nodeHeight(a));
    order.push(...isolated);
    return order;
}

/**
 * Génère les positions candidates pour un rectangle de taille donnée : le
 * long de chaque table déjà posée (droite, gauche, dessous, dessus), avec les
 * alignements haut/bas et gauche/droite, ce qui permet de repérer et de
 * combler les espaces vides entre les tables.
 */
function candidatePositions(placed: Rect[], size: Box): Point[] {
    if (placed.length === 0) {
        return [{ x: 0, y: 0 }];
    }
    const points: Point[] = [];
    const seen = new Set<string>();
    const push = (x: number, y: number) => {
        const key = `${Math.round(x)}:${Math.round(y)}`;
        if (!seen.has(key)) {
            seen.add(key);
            points.push({ x, y });
        }
    };
    for (const r of placed) {
        const right = r.x + r.width + GAP_X;
        const left = r.x - size.width - GAP_X;
        const below = r.y + r.height + GAP_Y;
        const above = r.y - size.height - GAP_Y;
        push(right, r.y);
        push(right, r.y + r.height - size.height);
        push(left, r.y);
        push(left, r.y + r.height - size.height);
        push(r.x, below);
        push(r.x + r.width - size.width, below);
        push(r.x, above);
        push(r.x + r.width - size.width, above);
    }
    return points;
}

interface Scoring {
    targetAspect: number;
    /** Enveloppe idéale du diagramme complet, aux proportions de l'écran. */
    envelope: Box;
    /** Degré normalisé [0, 1] : 1 pour la table la plus connectée. */
    hubWeight: number;
    isLeaf: boolean;
    neighbourCenters: Point[];
    /** Identifiants des voisines déjà posées, alignés sur `neighbourCenters`. */
    neighbourIds: string[];
    /** Toutes les tables déjà posées, par identifiant. */
    placedRects: Map<string, Rect>;
    /** Relations déjà tracées entre tables posées. */
    placedEdges: PlacedEdge[];
}

/**
 * Compte les conflits entre relations et tables qu'entraînerait la pose du
 * rectangle :
 *  - chaque relation reliant la nouvelle table à une voisine posée et qui
 *    traverserait une autre table posée ;
 *  - chaque relation existante (entre deux tables posées) que la nouvelle
 *    table viendrait recouvrir.
 */
function edgeConflicts(rect: Rect, scoring: Scoring): { through: number; covered: number } {
    const c = center(rect);
    let through = 0;
    for (let i = 0; i < scoring.neighbourCenters.length; i++) {
        const target = scoring.neighbourCenters[i];
        const targetId = scoring.neighbourIds[i];
        for (const [id, other] of scoring.placedRects) {
            if (id === targetId) continue;
            if (segmentIntersectsRect(c, target, other, EDGE_CLEARANCE)) {
                through++;
            }
        }
    }
    let covered = 0;
    for (const edge of scoring.placedEdges) {
        if (segmentIntersectsRect(edge.from, edge.to, rect, EDGE_CLEARANCE)) {
            covered++;
        }
    }
    return { through, covered };
}

/**
 * Évalue une position candidate (plus le score est bas, mieux c'est) :
 *  - attraction : distance aux voisines déjà placées ;
 *  - compacité : croissance de la surface englobante ;
 *  - forme : écart entre l'aspect du diagramme et celui de l'écran, et
 *    dépassement de l'enveloppe idéale ;
 *  - hauteur : les pivots préfèrent le haut, les tables peu connectées sont
 *    dissuadées de passer au-dessus d'eux ;
 *  - périphérie : une feuille est incitée à se poser au bord du diagramme ;
 *  - lisibilité : les relations ne doivent pas traverser d'autres tables et
 *    une table ne doit pas venir se poser sur une relation existante.
 */
function scorePosition(rect: Rect, bounds: Rect, scoring: Scoring): number {
    const unit = NODE_WIDTH;
    const c = center(rect);
    let score = 0;

    if (scoring.neighbourCenters.length > 0) {
        let sum = 0;
        for (const n of scoring.neighbourCenters) {
            sum += Math.hypot(c.x - n.x, c.y - n.y);
        }
        score += (W_ATTRACTION * sum) / unit;
    }

    const hasBounds = bounds.width > 0 || bounds.height > 0;
    const newBounds = extendBounds(bounds, rect);
    if (hasBounds) {
        const oldArea = Math.max(bounds.width * bounds.height, 1);
        const newArea = Math.max(newBounds.width * newBounds.height, 1);
        score += W_AREA * Math.log(newArea / oldArea);
        score += W_ASPECT * aspectError(newBounds, scoring.targetAspect);
        score += W_ENVELOPE * (overflow(newBounds, scoring.envelope) - overflow(bounds, scoring.envelope)) / unit;

        if (rect.y >= bounds.y) {
            // Position relative dans la hauteur actuelle (0 = tout en haut) :
            // seuls les vrais pivots (poids quadratique) sont attirés vers le haut.
            const relFrac = (rect.y - bounds.y) / Math.max(bounds.height, 1);
            score += W_TOP * scoring.hubWeight * scoring.hubWeight * relFrac;
        } else {
            const above = (bounds.y - rect.y) / unit;
            score += W_ABOVE * (1 - scoring.hubWeight) * above;
        }

        if (scoring.isLeaf) {
            // Distance au bord le plus proche de la boîte existante : 0 si la
            // feuille touche ou dépasse un bord, positive si elle est à l'intérieur.
            const inset = Math.max(
                0,
                Math.min(
                    rect.x - bounds.x,
                    bounds.x + bounds.width - (rect.x + rect.width),
                    rect.y - bounds.y,
                    bounds.y + bounds.height - (rect.y + rect.height)
                )
            );
            score += (W_LEAF_INSIDE * inset) / unit;
        }
    }

    const conflicts = edgeConflicts(rect, scoring);
    score += W_EDGE_THROUGH_TABLE * conflicts.through;
    score += W_TABLE_ON_EDGE * conflicts.covered;
    return score;
}

/** De combien (en px, largeur + hauteur) une boîte déborde de l'enveloppe. */
function overflow(box: Box, envelope: Box): number {
    return Math.max(0, box.width - envelope.width) + Math.max(0, box.height - envelope.height);
}

/**
 * Estime l'enveloppe idéale du diagramme : la surface cumulée des tables
 * (marges comprises) divisée par le taux de remplissage attendu, mise aux
 * proportions de l'écran.
 */
function idealEnvelope(sizes: Box[], targetAspect: number): Box {
    let area = 0;
    for (const s of sizes) {
        area += (s.width + GAP_X) * (s.height + GAP_Y);
    }
    const total = area / EXPECTED_FILL;
    const width = Math.sqrt(total * targetAspect);
    return { width, height: width / targetAspect };
}

/**
 * Positionne les tables de façon compacte et lisible :
 *  1. aspect cible calculé à partir des dimensions du viewer (1.6 par défaut) ;
 *  2. tables placées une à une, pivots (fortement reliées) d'abord et en haut,
 *     puis les tables intermédiaires autour de leurs voisines, puis les
 *     tables à relation unique en périphérie, enfin les tables isolées ;
 *  3. chaque table choisit, parmi les emplacements libres bordant les tables
 *     déjà posées, celui qui la rapproche de ses voisines directes tout en
 *     minimisant l'encombrement et en respectant les proportions de l'écran.
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
    const adjacency = buildAdjacency(nodes, edges);
    const maxDegree = Math.max(1, ...Array.from(adjacency.values()).map((s) => s.size));
    const order = placementOrder(nodes, adjacency);
    const envelope = idealEnvelope(
        nodes.map((n) => ({ width: NODE_WIDTH, height: nodeHeight(n) })),
        targetAspect
    );

    const placedRects = new Map<string, Rect>();
    const placedList: Rect[] = [];
    const placedEdges: PlacedEdge[] = [];
    let bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

    for (const node of order) {
        const size: Box = { width: NODE_WIDTH, height: nodeHeight(node) };
        const degree = adjacency.get(node.id)?.size ?? 0;
        const neighbourCenters: Point[] = [];
        const neighbourIds: string[] = [];
        for (const other of adjacency.get(node.id) ?? []) {
            const r = placedRects.get(other);
            if (r) {
                neighbourCenters.push(center(r));
                neighbourIds.push(other);
            }
        }
        const scoring: Scoring = {
            targetAspect,
            envelope,
            hubWeight: degree / maxDegree,
            isLeaf: degree === 1,
            neighbourCenters,
            neighbourIds,
            placedRects,
            placedEdges
        };

        let best: Rect | null = null;
        let bestScore = Infinity;
        for (const point of candidatePositions(placedList, size)) {
            const rect: Rect = { x: point.x, y: point.y, width: size.width, height: size.height };
            let free = true;
            for (const other of placedList) {
                if (collides(rect, other)) {
                    free = false;
                    break;
                }
            }
            if (!free) continue;
            const score = scorePosition(rect, bounds, scoring);
            if (score < bestScore) {
                bestScore = score;
                best = rect;
            }
        }
        if (!best) {
            // Ne devrait pas arriver (il y a toujours une place à droite du
            // diagramme) : on pose la table sous tout le reste par sécurité.
            best = { x: bounds.x, y: bounds.y + bounds.height + GAP_Y, width: size.width, height: size.height };
        }
        placedRects.set(node.id, best);
        placedList.push(best);
        const bestCenter = center(best);
        for (let i = 0; i < neighbourIds.length; i++) {
            placedEdges.push({
                sourceId: node.id,
                targetId: neighbourIds[i],
                from: bestCenter,
                to: neighbourCenters[i]
            });
        }
        bounds = extendBounds(bounds, best);
    }

    const origin = boundsOf(placedList);
    return nodes.map((node) => {
        const rect = placedRects.get(node.id);
        if (!rect) return node;
        return {
            ...node,
            position: { x: PADDING + rect.x - origin.x, y: PADDING + rect.y - origin.y }
        };
    });
}
