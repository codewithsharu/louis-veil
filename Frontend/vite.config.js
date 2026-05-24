import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devBackendTarget = env.VITE_DEV_BACKEND_URL || 'http://localhost:9001'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
