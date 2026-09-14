/// <reference types="node" />
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pins the stable, always-needed vendors into a few long-lived chunks so a
 * change in app code doesn't invalidate them. Everything else (recharts,
 * qrcode, lodash, …) is left to Rollup so it follows the import graph and
 * lands in the lazy route chunk that actually needs it.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) {
    return "vendor-react";
  }
  if (id.includes("/node_modules/@firebase/") || id.includes("/node_modules/firebase/")) {
    return "vendor-firebase";
  }
  if (id.includes("/node_modules/@radix-ui/")) return "vendor-radix";
  return undefined;
}

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Recompresses every imported/public raster + SVG asset at build time.
    ViteImageOptimizer({
      jpg: { quality: 78, mozjpeg: true },
      jpeg: { quality: 78, mozjpeg: true },
      png: { quality: 80, compressionLevel: 9 },
      webp: { quality: 78 },
      avif: { quality: 55 },
      svg: { multipass: true },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  css: {
    transformer: "lightningcss",
  },

  esbuild: {
    // Strip debug statements and license banners from the production bundle
    // only — keep console output available during `vite dev`.
    drop: command === "build" ? ["console", "debugger"] : [],
    legalComments: "none",
  },

  build: {
    target: "es2020",
    minify: "esbuild",
    cssMinify: "lightningcss",
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      // es2020 targets support <link rel="modulepreload"> natively.
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
