import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        abyssal: resolve(import.meta.dirname, 'abyssal/index.html'),
        meridian: resolve(import.meta.dirname, 'meridian/index.html'),
        baltic: resolve(import.meta.dirname, 'baltic/index.html'),
        balticOne: resolve(import.meta.dirname, 'baltic-one/index.html'),
        balticTwo: resolve(import.meta.dirname, 'baltic-two/index.html'),
      },
    },
  },
})
