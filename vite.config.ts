import path from "path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

export default defineConfig({
  plugins: [
    electron({
      entry: "../main/main.js",
      vite: {
        build: {
          outDir: path.resolve(__dirname, "dist/main"),
          emptyOutDir: true,
        },
      },
    }),
  ],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
