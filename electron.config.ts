import { defineConfig } from "electron-vite";
import path from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: path.resolve(__dirname, "src/main/main.ts"),
      },
    },
  },
  preload: {
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: path.resolve(__dirname, "src/preload/preload.ts"),
      },
    },
  },
  renderer: {
    root: "src/renderer",
    base: "./",
    build: {
      outDir: "out/renderer",
    },
  },
});
