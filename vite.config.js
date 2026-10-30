import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/psg-ai-brief': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
        rewrite: () => '/.netlify/functions/psg-ai-brief',
      },
    },
  },
});
