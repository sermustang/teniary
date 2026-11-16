import { defineConfig } from '@vite-pwa/assets-generator/config'

// Generates the app icons from the source image into public/.
// Run `npm run icons` after replacing public/icon-source.png.
// The source is a lime circle on a transparent background; the Apple and
// maskable icons are flattened onto the same lime so iOS doesn't paint the
// transparent corners black.
const LIME = '#beff00'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: {
      sizes: [192, 512],
      padding: 0,
      favicons: [[48, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: LIME },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: LIME },
    },
  },
  images: ['public/icon-source.png'],
})
