import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    hmr: {
      overlay: false,
      client: {
        host: 'window.location.hostname'
      }
    }
  },
  optimizeDeps: {
    exclude: ['@supabase/supabase-js', 'sql.js'],
    include: ['@babel/runtime']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    port: 4173,
    strictPort: true
  }
})