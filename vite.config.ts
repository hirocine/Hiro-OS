import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __REGISTER_SW__: JSON.stringify(mode === 'production'),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Generates `dist/stats.html` after every prod build — open it
    // to inspect what's inside each chunk. Set ANALYZE=1 to also
    // pop the report open automatically.
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: process.env.ANALYZE === '1',
    }),
    mode === 'production' && VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/orcamento\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2,woff}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^\/orcamento\/.*/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-v2',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2
              }
            }
          }
        ]
      },
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png', 'favicon-32x32.png'],
      manifestFilename: 'manifest.json',
      useCredentials: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bump the warning threshold a bit — the lazy ImportDialog chunk
    // (xlsx + papaparse) is intentionally large and won't shrink.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split node_modules into logical vendor chunks. The main
        // benefit isn't smaller total JS but rather (a) the initial
        // app chunk getting much lighter and (b) vendor code being
        // cached separately from app code — so a typical deploy only
        // invalidates a small chunk instead of the whole monolith.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Extract only the well-known shared vendors. Everything
          // else (jspdf, html2canvas, xlsx, papaparse, @tiptap, …)
          // is left alone so Rollup can fold it into whichever lazy
          // page actually needs it — that's what kept the original
          // graph healthy before this manualChunks block existed.
          //
          // Patterns use `/node_modules/<pkg>/` instead of bare
          // `/<pkg>/` so we don't accidentally swallow look-alike
          // packages (e.g. `react-day-picker` is NOT React core).
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) return 'react-vendor';
          if (id.includes('/node_modules/@radix-ui/')) return 'radix-vendor';
          if (id.includes('/node_modules/@supabase/')) return 'supabase-vendor';
          if (id.includes('/node_modules/@tanstack/')) return 'query-vendor';
          if (id.includes('/node_modules/date-fns/')) return 'date-vendor';
          if (id.includes('/node_modules/lucide-react/')) return 'icons-vendor';
          // Recharts is intentionally NOT extracted — letting Rollup
          // fold it into the pages that use it keeps initial JS lean
          // for the (majority) of routes that don't show charts.
          return undefined;
        },
      },
    },
  },
}));
