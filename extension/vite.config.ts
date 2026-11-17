import { defineConfig } from "vite";
import { resolve } from "node:path";

// Compila la extensión en extension/dist (esa carpeta es la que cargas en Chrome).
export default defineConfig({
  root: "src",
  publicDir: resolve(import.meta.dirname, "public"),
  resolve: {
    // Reutilizamos la MISMA fórmula de precio de la web
    alias: { "@": resolve(import.meta.dirname, "../src") },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    target: "chrome116",
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "src/popup.html"),
        background: resolve(import.meta.dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (c) => (c.name === "background" ? "background.js" : "assets/[name]-[hash].js"),
      },
    },
  },
  test: { root: ".", include: ["src/**/*.test.ts"], environment: "jsdom" },
});
