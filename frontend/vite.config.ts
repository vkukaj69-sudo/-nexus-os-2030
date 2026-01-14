
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the mode (development, production, etc.)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Direct injection of strings. Avoids exposing the whole process object.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.MASTER_KEY': JSON.stringify(env.MASTER_KEY || 'nexus2030')
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'framer-motion', 'recharts', 'lucide-react']
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
