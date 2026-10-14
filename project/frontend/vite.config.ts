import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' : GitHub Pages 하위 경로(/coffee-game/)에서도 동작
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
})
