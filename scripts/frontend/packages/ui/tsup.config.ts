import { defineConfig } from "tsup";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * esbuild strips module-level directives (e.g. "use client") whenever it
 * bundles multiple modules together, and it also strips any directive
 * injected via `banner` for the very same reason (it operates on the final
 * bundled output, not per-module). Since this package's entry
 * (`src/index.ts`) only re-exports client components/hooks, we re-inject the
 * directive via tsup's own `onSuccess` hook, once the final files are
 * written, so ESM/CJS output, source maps, `.d.ts`/`.d.mts` and exports are
 * all preserved untouched.
 */
const DIRECTIVE = '"use client";\n';

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "lucide-react"],
  treeshake: true,
  outDir: "dist",
  async onSuccess() {
    for (const file of ["index.js", "index.mjs"]) {
      const filePath = join(__dirname, "dist", file);
      const content = readFileSync(filePath, "utf8");
      if (!content.startsWith(DIRECTIVE)) {
        writeFileSync(filePath, DIRECTIVE + content, "utf8");
      }
    }
  },
});
