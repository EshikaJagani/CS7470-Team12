import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // this is to let our phones open the site through a cloudflare tunnel (https)
    allowedHosts: ['.trycloudflare.com'],
  },
})
