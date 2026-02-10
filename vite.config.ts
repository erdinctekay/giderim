import { paraglide } from "@inlang/paraglide-vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appUrl = env.VITE_APP_URL;
  if (!appUrl?.trim()) {
    throw new Error(
      "VITE_APP_URL is required for build. Set it in .env or your CI environment (e.g. Netlify).",
    );
  }

  return {
  optimizeDeps: {
    exclude: ["@evolu/react", "@sqlite.org/sqlite-wasm"],
    include: ["react-dom"],
  },
  worker: {
    format: "es",
  },
  define: {
    __APP_VERSION__: JSON.stringify(
      (JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")) as { version: string }).version,
    ),
  },
  server: {
    host: "0.0.0.0",
    port: 5171,
    strictPort: true,

    ...(process.env.NODE_ENV === "development" &&
      fs.existsSync("./localhost-key.pem") &&
      fs.existsSync("./localhost.pem") && {
        https: {
          key: fs.readFileSync(path.resolve(__dirname, "./localhost-key.pem")),
          cert: fs.readFileSync(path.resolve(__dirname, "./localhost.pem")),
        },
      }),
  },
  plugins: [
    {
      name: "html-inject-app-url",
      transformIndexHtml(html) {
        return html.replace("__VITE_APP_URL__", appUrl);
      },
    },
    react(),
    Unfonts({
      fontsource: {
        families: ["Inter Variable", "Roboto Mono Variable"],
      },
    }),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,wasm}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        type: "module",
        navigateFallback: "index.html",
        suppressWarnings: true,
        enabled: true,
      },
      manifest: {
        orientation: "portrait",
        name: "giderim",
        short_name: "giderim",
        description:
          "Privacy first, local first, no tracking, no ads, no data collection.",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: process.env.NODE_ENV === "development",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
