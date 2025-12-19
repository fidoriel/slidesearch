import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

import path from "path";
import tailwindcss from "tailwindcss";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createRequire } from "node:module";
import { normalizePath } from "vite";

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),

    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: "",
        },
      ],
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
    },
  },
});
