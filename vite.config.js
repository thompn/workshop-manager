import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api/nhtsa': {
        target: 'https://vpic.nhtsa.dot.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nhtsa/, '/api'),
      },
    },
  }
})
