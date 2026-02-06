import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ base must match your GitHub Pages repo path
export default defineConfig({
  base: '/neo-tokyo-card-clash/',
  plugins: [react()],
})
