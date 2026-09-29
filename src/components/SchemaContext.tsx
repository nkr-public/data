import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CdmModel } from "../lib/cdmTypes";
import schemaData from "../data/data.json";

interface SchemaContextValue {
    isMenuOpen: boolean;
    openMenu: () => void;
    closeMenu: () => void;
    model: CdmModel | null;
    showModel: (model: CdmModel) => void;
    closeViewer: () => void;
}

const SchemaContext = createContext<SchemaContextValue | null>(null);

export function SchemaProvider({
    children,
    initialModel
}: {
    children: React.ReactNode;
    initialModel?: CdmModel | null;
}) {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [model, setModel] = useState<CdmModel | null>(
        initialModel !== undefined ? initialModel : (schemaData as unknown as CdmModel)
    );

    const openMenu = useCallback(() => setMenuOpen(true), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const showModel = useCallback((next: CdmModel) => {
        setModel(next);
        setMenuOpen(false);
    }, []);
    const closeViewer = useCallback(() => {
        setModel(null);
    }, []);

    const value = useMemo(
        () => ({ isMenuOpen, openMenu, closeMenu, model, showModel, closeViewer }),
        [isMenuOpen, openMenu, closeMenu, model, showModel, closeViewer]
    );

    return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
}

export function useSchemaContext(): SchemaContextValue {
    const ctx = useContext(SchemaContext);
    if (!ctx) {
        throw new Error("useSchemaContext must be used within a SchemaProvider");
    }
    return ctx;
}
