import React from "react";
import { Database, LayoutDashboard } from "lucide-react";
import { WindowControls } from "./WindowControls";
import { useSchemaContext } from "./SchemaContext";
import { SchemaMenu } from "./SchemaMenu";
import appPkg from "../../../package.json";

export function TitleBar() {
    const { openMenu } = useSchemaContext();

    const handleDoubleClick = async (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).getAttribute("data-tauri-drag-region") === "") {
            try {
                const { getCurrentWindow } = await import("@tauri-apps/api/window");
                await getCurrentWindow().toggleMaximize();
            } catch {
                // ignore : hors contexte Tauri
            }
        }
    };

    return (
        <header
            data-tauri-drag-region
            onDoubleClick={handleDoubleClick}
            className="sticky top-0 z-[100] w-full border-b border-border bg-surface/90 backdrop-blur select-none"
        >
            <div
                data-tauri-drag-region
                className="w-full flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6 gap-4"
            >
                <div data-tauri-drag-region className="flex items-center gap-2 font-black text-xl tracking-tight text-primary shrink-0">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-xl">
                        <LayoutDashboard className="w-4.5 h-4.5" />
                    </div>
                    <span>CDM Viewer</span>
                    <span className="text-xs font-normal text-foreground-muted ml-2">v{appPkg.version}</span>
                </div>

                <div data-tauri-drag-region="false" className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={openMenu}
                            title="Ouvrir un schéma"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Database className="w-4 h-4" />
                            <span>Schéma</span>
                        </button>
                        <SchemaMenu />
                    </div>
                    <WindowControls />
                </div>
            </div>
        </header>
    );
}
