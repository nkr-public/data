export interface Column {
    name: string;
    type: string;
    category: string;
    foreignKey?: boolean;
}

export interface Index {
    name: string;
    columns: string[];
    unique: boolean;
}

export interface Table {
    id: string;
    table: string;
    nbRows: number;
    columns: Column[];
    indexes?: Index[];
}

export interface Relation {
    id: string;
    name: string;
    sourceTable: string;
    targetTable: string;
    sourceCardinality?: string;
    targetCardinality?: string;
    cardinality?: string;
    sourceColumns?: string[];
    targetColumns?: string[];
}

export interface CdmModel {
    tables: Table[];
    relations: Relation[];
    clusters?: string[][];
}

export interface SchemaExportRequest {
    type: string;
    url: string;
    username: string;
    password: string;
    schema: string;
}

export interface SavedSchema extends SchemaExportRequest {
    id: string;
    label: string;
}
