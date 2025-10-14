import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
    plugins: [svelte()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3000",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split highlight.js into separate chunk
                    highlight: ["highlight.js"],
                    // Split marked into separate chunk
                    markdown: [
                        "marked",
                        "marked-gfm-heading-id",
                        "marked-highlight",
                    ],
                },
            },
        },
        // Enable minification
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
            },
        },
    },
});
