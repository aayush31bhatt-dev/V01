// electron.vite.config.ts
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
var electron_vite_config_default = defineConfig({
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
    root: "src/renderer",
    plugins: [react()],
    build: {
      outDir: "dist/renderer"
    }
  }
});
export {
  electron_vite_config_default as default
};
