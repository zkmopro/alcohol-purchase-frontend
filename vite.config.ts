import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://verifier-sandbox.wallet.gov.tw',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
