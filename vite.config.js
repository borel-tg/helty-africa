import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import {
  APP_BRAND_NAME,
  APP_BRAND_SHORT_NAME,
  getAppPageTitle,
} from "./src/lib/brand.js";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-brand-html",
      transformIndexHtml(html) {
        return html
          .replace(
            /<title>.*?<\/title>/,
            `<title>${getAppPageTitle()}</title>`
          )
          .replace(
            /content="Helty"/g,
            `content="${APP_BRAND_SHORT_NAME}"`
          )
          .replace(/aria-label="Helty Africa icon"/g, `aria-label="${APP_BRAND_NAME} icon"`);
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["app-icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: APP_BRAND_NAME,
        short_name: APP_BRAND_SHORT_NAME,
        description: `Plateforme de formation santé ${APP_BRAND_NAME}`,
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
