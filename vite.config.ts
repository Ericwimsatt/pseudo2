import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = parseInt(process.env.DEV_PORT || '5173', 10)

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port,
    strictPort: true,
  },
})
