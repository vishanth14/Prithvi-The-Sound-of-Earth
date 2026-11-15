import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/@react-three') || id.includes('node_modules/maath')) {
            return 'vendor-r3f';
          }
          if (id.includes('node_modules/postprocessing')) {
            return 'vendor-postprocessing';
          }
          if (id.includes('node_modules/tone')) {
            return 'vendor-audio';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/d3') || id.includes('node_modules/papaparse') || id.includes('node_modules/zod')) {
            return 'vendor-data';
          }
        },
      },
    },
  },
})

