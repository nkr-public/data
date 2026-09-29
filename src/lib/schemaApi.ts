import type { CdmModel, SchemaExportRequest } from "./cdmTypes";
import schemaData from "../data/data.json";

export async function loadSchema(_request?: SchemaExportRequest): Promise<CdmModel> {
    return schemaData as unknown as CdmModel;
}
