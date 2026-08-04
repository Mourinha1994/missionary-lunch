import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    // Expor na rede local (host:true) para testar em celulares/outros aparelhos.
    host: true,
    port: 5173,
    proxy: {
      // O front consome a API no mesmo origin (/api); o Vite encaminha para a API.
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3009',
        changeOrigin: true,
      },
    },
  },
})