import { Navigate } from "react-router-dom";
import { useSchemaContext } from "./SchemaContext";
import { SchemaViewer } from "./SchemaViewer";

export function SchemaViewerPage() {
    const { model } = useSchemaContext();

    if (!model) {
        return <Navigate to="/" replace />;
    }

    return <SchemaViewer />;
}
