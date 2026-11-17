import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BACKEND_URL 
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, proxy },
  }
})
