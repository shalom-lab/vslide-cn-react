import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions sets GITHUB_ACTIONS=true; project Pages live under /vslide-cn-react/
const base = process.env.GITHUB_ACTIONS ? '/vslide-cn-react/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
