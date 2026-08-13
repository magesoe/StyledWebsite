import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        abyssal: resolve(import.meta.dirname, 'abyssal/index.html'),
        meridian: resolve(import.meta.dirname, 'meridian/index.html'),
      },
    },
  },
})
