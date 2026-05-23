import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rendererRoot = resolve(configDir, "src/renderer");

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: "src/main/index.ts"
      }
    }
  },

  preload: {
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: "src/preload/index.ts"
      }
    }
  },

  renderer: {
    root: rendererRoot,
    plugins: [react()],
    build: {
      outDir: resolve(configDir, "dist/renderer"),
      rollupOptions: {
        input: resolve(rendererRoot, "index.html")
      }
    }
  }
});
