import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' : GitHub Pages 하위 경로(/coffee-game/)에서도 동작
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  // exceljs 는 버튼 클릭 시에만 불러오므로, 개발 서버 시작 때 미리 준비 (첫 클릭 실패 방지)
  optimizeDeps: { include: ['exceljs'] },
})
