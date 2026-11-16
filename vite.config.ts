import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// GitHub Pages serves the app from /<repo-name>/. The deploy workflow sets
// BASE_PATH from the repository name; locally it defaults to /teniary/.
const base = process.env.BASE_PATH ?? '/teniary/'

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version is applied only when the user taps "Actualizar",
      // so the page never reloads while a form is being filled in.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Teniary',
        short_name: 'Teniary',
        description: 'Notas de rendimiento después de cada partido de tenis.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3f4ef',
        theme_color: '#f3f4ef',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
