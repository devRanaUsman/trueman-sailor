import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.ngrok-free.dev', 'tearless-untragically-kaye.ngrok-free.dev'],
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
});
