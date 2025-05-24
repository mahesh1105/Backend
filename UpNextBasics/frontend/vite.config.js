import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // Providing the URL on which the backend is running
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [react()],
})

// NOTE: 
// If you are running your code on Github CodeSpace or CodeSandBox
// They will show some different URL, but behind the scenes they will use localhost only
