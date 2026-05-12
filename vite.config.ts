import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/issuer-api': {
        target: 'https://issuer-sandbox.wallet.gov.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/issuer-api/, ''),
        secure: true,
      },
      '/api': {
        target: 'https://verifier-sandbox.wallet.gov.tw',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
