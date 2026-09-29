import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { KeyRound, Link2, ListOrdered } from "lucide-react";
import type { Column } from "../lib/cdmTypes";
import { SOURCE_HANDLE_PREFIX, TARGET_HANDLE_PREFIX, type HandleSide } from "../lib/elkLayout";

export type TableDisplayMode = "all" | "name" | "keys";

/**
 * En mode "Keys only", on affiche les identifiants (ids), les identifiants
 * externes (external ids) ainsi que les colonnes référencées par d'autres tables.
 */
const KEY_COLUMN_CATEGORIES = new Set(["id", "external"]);

export interface TableNodeData {
    table: string;
    nbRows: number;
    columns: Column[];
    /** La table fait partie de la zone du graphe actuellement "allumée". */
    highlighted?: boolean;
    /** Une autre zone du graphe est allumée : la table est atténuée. */
    dimmed?: boolean;
    /** Mode d'affichage des colonnes : toutes, aucune (nom seul), ou clés uniquement. */
    displayMode?: TableDisplayMode;
}

const SIDES: { side: HandleSide; position: Position }[] = [
    { side: "top", position: Position.Top },
    { side: "bottom", position: Position.Bottom },
    { side: "left", position: Position.Left },
    { side: "right", position: Position.Right }
];

function TableNodeComponent({ data }: { data: TableNodeData }) {
    const borderClass = data.highlighted
        ? "border-amber-500 ring-2 ring-amber-500/60 shadow-xl"
        : "border-border shadow-md";
    const headerClass = data.highlighted
        ? "bg-amber-500 text-white"
        : "bg-primary text-primary-foreground";
    const handleClass = data.highlighted ? "!bg-amber-500" : "!bg-primary";
    const displayMode = data.displayMode ?? "all";
    const visibleColumns =
        displayMode === "name"
            ? []
            : displayMode === "keys"
                ? data.columns.filter((column) => KEY_COLUMN_CATEGORIES.has(column.category))
                : data.columns;

    return (
        <div
            className={`min-w-[240px] rounded-lg border bg-surface overflow-hidden text-xs transition-opacity ${borderClass}`}
            style={{ opacity: data.dimmed ? 0.35 : 1 }}
        >
            <div
                data-table-header
                className={`font-bold px-3 py-2 text-sm cursor-move flex items-center justify-between gap-2 ${headerClass}`}
            >
                <span className="truncate">{data.table}</span>
                <span className="rounded-full bg-black/80 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                    {data.nbRows.toLocaleString("fr-FR")}
                </span>
            </div>
            <div className="divide-y divide-border/60">
                {visibleColumns.map((column) => (
                    <div key={column.name} className="flex items-center justify-between gap-2 px-3 py-1.5">
                        <span className="flex items-center gap-1.5 text-foreground">
                            {column.category === "id" && (
                                <KeyRound className="w-3 h-3 text-amber-500 shrink-0" aria-label="Clé primaire" />
                            )}
                            {(column.foreignKey || column.category === "external") && (
                                <Link2 className="w-3 h-3 text-sky-500 shrink-0" aria-label="Clé étrangère" />
                            )}
                            {column.category === "index" && (
                                <ListOrdered className="w-3 h-3 text-emerald-500 shrink-0" aria-label="Index" />
                            )}
                            {column.name}
                        </span>
                        <span className="text-foreground-muted">{column.type}</span>
                    </div>
                ))}
            </div>
            {SIDES.map(({ side, position }) => (
                <React.Fragment key={side}>
                    <Handle
                        id={TARGET_HANDLE_PREFIX + side}
                        type="target"
                        position={position}
                        isConnectable={false}
                        className={handleClass}
                    />
                    <Handle
                        id={SOURCE_HANDLE_PREFIX + side}
                        type="source"
                        position={position}
                        isConnectable={false}
                        className={handleClass}
                    />
                </React.Fragment>
            ))}
        </div>
    );
}

export const TableNode = memo(TableNodeComponent);
