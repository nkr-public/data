import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import devtoolsJson from "vite-plugin-devtools-json";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";

const host = process.env.TAURI_DEV_HOST;

const devtoolsEnabled = process.env.ENABLE_DEVTOOLS === "true";

export default defineConfig(({command}) => ({
    plugins: [react(), ...(command === "serve" && devtoolsEnabled ? [devtoolsJson()] : [])],
    clearScreen: false,
    define: {
        "process.env.NEXT_PUBLIC_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL || BACKEND_URL),
        "process.env.BACKEND_URL": JSON.stringify(BACKEND_URL)
    },
    resolve: {
        alias: {
            "@": "/src"
        }
    },
    server: {
        port: 3000,
        strictPort: true,
        host: host || false,
        watch: {
            ignored: ["**/src-tauri/target/**"]
        },
        proxy: {
            "/api": {
                target: BACKEND_URL,
                changeOrigin: true
            }
        }
    },
    envPrefix: ["VITE_", "TAURI_"],
    build: {
        outDir: "dist",
        target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "es2021",
        minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
        sourcemap: !!process.env.TAURI_ENV_DEBUG
    }
}));
