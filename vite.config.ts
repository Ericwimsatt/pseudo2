import { defineConfig } from 'vite'

const port = parseInt(process.env.DEV_PORT || '5173', 10)

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port,
    strictPort: true,
  },
})
